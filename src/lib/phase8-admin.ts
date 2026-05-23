import type { CardBlocklist } from "./phase5-contracts";
import type { CampaignReleaseStatus, ReleaseGateStatus } from "./phase6-contracts";
import { PHASE6_RELEASE_GATES } from "./phase6-launch";
import {
  PHASE7_THEME_REGISTRY,
  createVenueActivation,
  getThemeCardsForCampaign
} from "./phase7-registry";
import {
  AdminActionSchema,
  AdminConfigStoreSchema,
  AdminDraftChangeSchema,
  AdminMetricsSnapshotSchema,
  ConfigVersionSchema,
  EDITABLE_ADMIN_SURFACES,
  Phase8AdminReportSchema,
  type AdminAction,
  type AdminConfigStore,
  type AdminDraftChange,
  type AdminMetricsSnapshot,
  type AdminUserRole,
  type ConfigVersion,
  type Phase8AdminReport
} from "./phase8-contracts";

const REVIEWED_AT = "2026-04-30T00:00:00.000Z";
const SOURCE_REGISTRY_VERSION = "phase7-registry-v0.1";
const FORBIDDEN_PRIVACY_FIELDS = new Set([
  "camera_frame",
  "camera_frames",
  "raw_image",
  "rawImage",
  "face_image",
  "faceImage",
  "video_blob",
  "raw_video",
  "face_landmarks",
  "landmarks",
  "keypoints",
  "face_template",
  "biometric_template",
  "identity_id",
  "user_id",
  "phone",
  "mobile",
  "real_name",
  "device_fingerprint"
]);
const BLOCKLIST_REVIEWER_ROLES = ["content", "compliance", "product", "legal"] as const;

type BlocklistReviewerRole = CardBlocklist["reviewer_role"];

export const PHASE8_CONFIG_VERSION: ConfigVersion = ConfigVersionSchema.parse({
  version_id: "CFG-001",
  source_registry_version: SOURCE_REGISTRY_VERSION,
  status: "draft",
  created_at: REVIEWED_AT,
  published_at: null,
  owner_role: "operations",
  change_summary: "Phase 8 admin config center seeded from the Phase 7 multi-theme registry."
});

export const PHASE8_DRAFT_CHANGE: AdminDraftChange = AdminDraftChangeSchema.parse({
  draft_id: "DRF-001",
  target_type: "config_version",
  target_id: PHASE8_CONFIG_VERSION.version_id,
  operation: "update",
  validation_status: "valid",
  risk_hits: []
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasForbiddenPrivacyField(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasForbiddenPrivacyField(item));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(
    ([key, nested]) => FORBIDDEN_PRIVACY_FIELDS.has(key) || hasForbiddenPrivacyField(nested)
  );
}

function nextActionId(store: AdminConfigStore): string {
  return `ACTN-${String(store.audit_logs.length + 1).padStart(3, "0")}`;
}

function toBlocklistReviewerRole(role: AdminUserRole): BlocklistReviewerRole {
  return BLOCKLIST_REVIEWER_ROLES.includes(role as BlocklistReviewerRole)
    ? (role as BlocklistReviewerRole)
    : "product";
}

function appendAudit(store: AdminConfigStore, action: AdminAction): AdminConfigStore {
  return AdminConfigStoreSchema.parse({
    ...store,
    audit_logs: [action, ...store.audit_logs]
  });
}

function createMetricsSnapshot(campaignId: string): AdminMetricsSnapshot {
  const campaign = PHASE7_THEME_REGISTRY.campaigns.find((item) => item.campaign_id === campaignId);

  if (!campaign) {
    throw new Error(`Unknown campaign for metrics snapshot: ${campaignId}`);
  }

  return AdminMetricsSnapshotSchema.parse({
    campaign_id: campaign.campaign_id,
    completion_rate: campaign.metrics_targets.completion_rate,
    manual_completion_rate: campaign.metrics_targets.manual_completion_rate,
    action_success_rate: campaign.metrics_targets.action_success_rate,
    poster_generation_rate: campaign.metrics_targets.poster_generation_rate,
    share_click_rate: campaign.metrics_targets.share_click_rate,
    negative_feedback_count: campaign.metrics_targets.negative_feedback_count,
    updated_at: REVIEWED_AT
  });
}

export function assertPhase8PrivacyBoundary(payload: unknown): boolean {
  return !hasForbiddenPrivacyField(payload);
}

export function createPhase8AdminConfigStore(): AdminConfigStore {
  const store = AdminConfigStoreSchema.parse({
    themes: PHASE7_THEME_REGISTRY.themes,
    campaigns: PHASE7_THEME_REGISTRY.campaigns,
    scenarios: PHASE7_THEME_REGISTRY.scenarios,
    venue_activations: [
      createVenueActivation({
        venue_name: "Phase 8 venue rehearsal",
        city: "Hangzhou",
        start_at: "2026-06-01T00:00:00.000Z",
        end_at: "2026-06-07T00:00:00.000Z"
      })
    ],
    card_blocklist: [],
    release_gates: PHASE6_RELEASE_GATES,
    metrics_fixtures: PHASE7_THEME_REGISTRY.campaigns.map((campaign) =>
      createMetricsSnapshot(campaign.campaign_id)
    ),
    audit_logs: [
      AdminActionSchema.parse({
        action_id: "ACTN-001",
        actor_role: "operations",
        action_type: "import",
        target_type: "config_version",
        target_id: PHASE8_CONFIG_VERSION.version_id,
        before: null,
        after: {
          source_registry_version: SOURCE_REGISTRY_VERSION,
          campaign_count: PHASE7_THEME_REGISTRY.campaigns.length,
          theme_count: PHASE7_THEME_REGISTRY.themes.length
        },
        reason: "Seed Phase 8 admin config center from Phase 7 registry.",
        created_at: REVIEWED_AT
      })
    ]
  });

  if (!assertPhase8PrivacyBoundary(store)) {
    throw new Error("Phase 8 admin store contains forbidden privacy fields.");
  }

  return store;
}

export function addCardToAdminBlocklist(
  store: AdminConfigStore,
  cardId: string,
  actorRole: AdminUserRole,
  reason: string,
  notes: string
): AdminConfigStore {
  if (actorRole === "viewer") {
    throw new Error("Viewer role cannot edit the admin blocklist.");
  }
  if (store.card_blocklist.some((entry) => entry.card_id === cardId)) {
    throw new Error(`Card is already blocked: ${cardId}`);
  }

  const blocklistEntry: CardBlocklist = {
    card_id: cardId,
    reason,
    blocked_at: REVIEWED_AT,
    reviewer_role: toBlocklistReviewerRole(actorRole),
    notes
  };
  const action = AdminActionSchema.parse({
    action_id: nextActionId(store),
    actor_role: actorRole,
    action_type: "block",
    target_type: "card_blocklist",
    target_id: cardId,
    before: null,
    after: blocklistEntry,
    reason,
    created_at: REVIEWED_AT
  });

  return appendAudit(
    AdminConfigStoreSchema.parse({
      ...store,
      card_blocklist: [blocklistEntry, ...store.card_blocklist]
    }),
    action
  );
}

export function removeCardFromAdminBlocklist(
  store: AdminConfigStore,
  cardId: string,
  actorRole: AdminUserRole,
  reason: string
): AdminConfigStore {
  if (actorRole === "viewer") {
    throw new Error("Viewer role cannot edit the admin blocklist.");
  }

  const existing = store.card_blocklist.find((entry) => entry.card_id === cardId);

  if (!existing) {
    throw new Error(`Card is not blocked: ${cardId}`);
  }

  const action = AdminActionSchema.parse({
    action_id: nextActionId(store),
    actor_role: actorRole,
    action_type: "unblock",
    target_type: "card_blocklist",
    target_id: cardId,
    before: existing,
    after: null,
    reason,
    created_at: REVIEWED_AT
  });

  return appendAudit(
    AdminConfigStoreSchema.parse({
      ...store,
      card_blocklist: store.card_blocklist.filter((entry) => entry.card_id !== cardId)
    }),
    action
  );
}

export function updateAdminReleaseGate(
  store: AdminConfigStore,
  gateId: string,
  status: ReleaseGateStatus,
  actorRole: AdminUserRole,
  evidence: string,
  blockerReason: string | null
): AdminConfigStore {
  if (actorRole === "viewer") {
    throw new Error("Viewer role cannot edit release gates.");
  }

  const gate = store.release_gates.find((item) => item.gate_id === gateId);

  if (!gate) {
    throw new Error(`Unknown release gate: ${gateId}`);
  }

  const nextGate = {
    ...gate,
    status,
    evidence,
    blocker_reason: blockerReason,
    reviewed_at: REVIEWED_AT
  };
  const action = AdminActionSchema.parse({
    action_id: nextActionId(store),
    actor_role: actorRole,
    action_type: "review",
    target_type: "release_gate",
    target_id: gateId,
    before: gate,
    after: nextGate,
    reason: evidence,
    created_at: REVIEWED_AT
  });

  return appendAudit(
    AdminConfigStoreSchema.parse({
      ...store,
      release_gates: store.release_gates.map((item) => (item.gate_id === gateId ? nextGate : item))
    }),
    action
  );
}

export function updateAdminCampaignStatus(
  store: AdminConfigStore,
  campaignId: string,
  releaseStatus: CampaignReleaseStatus,
  actorRole: AdminUserRole,
  reason: string
): AdminConfigStore {
  if (actorRole === "viewer") {
    throw new Error("Viewer role cannot edit campaign status.");
  }

  const campaign = store.campaigns.find((item) => item.campaign_id === campaignId);

  if (!campaign) {
    throw new Error(`Unknown campaign: ${campaignId}`);
  }

  const nextCampaign = {
    ...campaign,
    release_status: releaseStatus
  };
  const action = AdminActionSchema.parse({
    action_id: nextActionId(store),
    actor_role: actorRole,
    action_type: "update",
    target_type: "campaign",
    target_id: campaignId,
    before: campaign,
    after: nextCampaign,
    reason,
    created_at: REVIEWED_AT
  });

  return appendAudit(
    AdminConfigStoreSchema.parse({
      ...store,
      campaigns: store.campaigns.map((item) => (item.campaign_id === campaignId ? nextCampaign : item))
    }),
    action
  );
}

export function publishAdminConfigVersion(
  store: AdminConfigStore,
  version: ConfigVersion,
  actorRole: AdminUserRole
): ConfigVersion {
  if (actorRole === "viewer") {
    throw new Error("Viewer role cannot publish config versions.");
  }
  if (!assertPhase8PrivacyBoundary(store)) {
    throw new Error("Cannot publish config with forbidden privacy fields.");
  }
  if (store.release_gates.some((gate) => gate.status !== "pass")) {
    throw new Error("Cannot publish config until every release gate passes.");
  }

  return ConfigVersionSchema.parse({
    ...version,
    status: "published",
    published_at: REVIEWED_AT,
    owner_role: actorRole
  });
}

export function getAdminCampaignCards(store: AdminConfigStore, campaignId: string) {
  return getThemeCardsForCampaign(campaignId, store.card_blocklist);
}

export function exportAdminConfigStore(store: AdminConfigStore): string {
  const parsed = AdminConfigStoreSchema.parse(store);

  if (!assertPhase8PrivacyBoundary(parsed)) {
    throw new Error("Cannot export admin config with forbidden privacy fields.");
  }

  return JSON.stringify(parsed, null, 2);
}

export function importAdminConfigStore(payload: string): AdminConfigStore {
  const parsed = AdminConfigStoreSchema.parse(JSON.parse(payload));

  if (!assertPhase8PrivacyBoundary(parsed)) {
    throw new Error("Cannot import admin config with forbidden privacy fields.");
  }

  return parsed;
}

export function buildPhase8AdminReport(
  store: AdminConfigStore,
  version: ConfigVersion
): Phase8AdminReport {
  const privacyCheckPassed = assertPhase8PrivacyBoundary(store);
  const publishedCampaignCount = store.campaigns.filter((campaign) =>
    ["ready", "live"].includes(campaign.release_status)
  ).length;
  const allGatesPassed = store.release_gates.every((gate) => gate.status === "pass");
  const metricsClean = store.metrics_fixtures.every((metric) => metric.negative_feedback_count === 0);

  return Phase8AdminReportSchema.parse({
    config_version_id: version.version_id,
    editable_surfaces: EDITABLE_ADMIN_SURFACES,
    audit_count: store.audit_logs.length,
    blocked_card_count: store.card_blocklist.length,
    published_campaign_count: publishedCampaignCount,
    privacy_check_passed: privacyCheckPassed,
    go_no_go_decision: privacyCheckPassed && allGatesPassed && metricsClean ? "go" : "hold"
  });
}

export const samplePhase8AdminStore = createPhase8AdminConfigStore();
export const samplePhase8AdminReport = buildPhase8AdminReport(
  samplePhase8AdminStore,
  PHASE8_CONFIG_VERSION
);
