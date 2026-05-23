import type { CardBlocklist } from "./phase5-contracts";
import type { CampaignReleaseStatus, ReleaseGateStatus } from "./phase6-contracts";
import { getCampaignThemePack, getThemeCardsForCampaign } from "./phase7-registry";
import {
  PHASE8_CONFIG_VERSION,
  addCardToAdminBlocklist,
  assertPhase8PrivacyBoundary,
  createPhase8AdminConfigStore,
  updateAdminCampaignStatus,
  updateAdminReleaseGate
} from "./phase8-admin";
import type { AdminConfigStore, AdminUserRole } from "./phase8-contracts";
import {
  AdminAccountSchema,
  AnonymousMetricsEventV02Schema,
  ConfigVersionV02Schema,
  PermissionPolicySchema,
  Phase9SaasReportSchema,
  PublishedConfigSnapshotSchema,
  SaasAuditLogSchema,
  TenantWorkspaceSchema,
  type AdminAccount,
  type AnonymousMetricsEventV02,
  type ConfigRepository,
  type ConfigVersionV02,
  type PermissionPolicy,
  type Phase9SaasReport,
  type PublishedConfigSnapshot,
  type SaasAdminAction,
  type SaasAuditLog,
  type TenantWorkspace
} from "./phase9-contracts";
import { AdminMetricsSnapshotSchema, type AdminMetricsSnapshot } from "./phase8-contracts";

const REVIEWED_AT = "2026-04-30T00:00:00.000Z";
const INTERNAL_TENANT_ID = "TEN-001";
const CLIENT_DEMO_TENANT_ID = "TEN-002";

export type SaasDraftStore = {
  tenant_id: string;
  config_version_id: string;
  store: AdminConfigStore;
};

export type Phase9SaasState = {
  tenants: TenantWorkspace[];
  admin_accounts: AdminAccount[];
  permission_policies: PermissionPolicy[];
  config_versions: ConfigVersionV02[];
  draft_stores: SaasDraftStore[];
  published_snapshots: PublishedConfigSnapshot[];
  audit_logs: SaasAuditLog[];
  metrics_events: AnonymousMetricsEventV02[];
};

export type Phase9Repository = ConfigRepository & {
  blockCard: (
    tenantId: string,
    actorAdminId: string,
    cardId: string,
    reason: string,
    notes: string
  ) => AdminConfigStore;
  reviewReleaseGate: (
    tenantId: string,
    actorAdminId: string,
    gateId: string,
    status: ReleaseGateStatus,
    evidence: string,
    blockerReason: string | null
  ) => AdminConfigStore;
  updateCampaignStatus: (
    tenantId: string,
    actorAdminId: string,
    campaignId: string,
    releaseStatus: CampaignReleaseStatus,
    reason: string
  ) => AdminConfigStore;
  getState: () => Phase9SaasState;
};

const FULL_ACCESS_ACTIONS: SaasAdminAction[] = [
  "config:read",
  "config:save_draft",
  "config:submit_review",
  "config:publish",
  "config:rollback",
  "blocklist:block",
  "blocklist:unblock",
  "release_gate:review",
  "campaign:update",
  "metrics:read",
  "snapshot:export",
  "audit:read"
];

export const PHASE9_PERMISSION_POLICIES: PermissionPolicy[] = PermissionPolicySchema.array().parse([
  {
    role: "product",
    allowed_actions: [
      "config:read",
      "config:save_draft",
      "config:submit_review",
      "config:publish",
      "campaign:update",
      "metrics:read",
      "snapshot:export",
      "audit:read"
    ],
    blocked_actions: ["config:rollback"],
    requires_review: ["config:publish"]
  },
  {
    role: "content",
    allowed_actions: [
      "config:read",
      "config:save_draft",
      "config:submit_review",
      "blocklist:block",
      "blocklist:unblock",
      "metrics:read",
      "audit:read"
    ],
    blocked_actions: ["config:publish", "config:rollback"],
    requires_review: ["config:submit_review"]
  },
  {
    role: "compliance",
    allowed_actions: [
      "config:read",
      "config:submit_review",
      "release_gate:review",
      "metrics:read",
      "snapshot:export",
      "audit:read"
    ],
    blocked_actions: ["config:publish", "config:rollback"],
    requires_review: ["release_gate:review"]
  },
  {
    role: "legal",
    allowed_actions: [
      "config:read",
      "config:submit_review",
      "release_gate:review",
      "metrics:read",
      "snapshot:export",
      "audit:read"
    ],
    blocked_actions: ["config:publish", "config:rollback"],
    requires_review: ["release_gate:review"]
  },
  {
    role: "operations",
    allowed_actions: [
      "config:read",
      "config:save_draft",
      "blocklist:block",
      "blocklist:unblock",
      "release_gate:review",
      "campaign:update",
      "metrics:read",
      "snapshot:export",
      "audit:read"
    ],
    blocked_actions: ["config:publish", "config:rollback"],
    requires_review: ["blocklist:block", "campaign:update"]
  },
  {
    role: "engineering",
    allowed_actions: FULL_ACCESS_ACTIONS,
    blocked_actions: [],
    requires_review: ["config:publish", "config:rollback"]
  },
  {
    role: "viewer",
    allowed_actions: ["config:read", "metrics:read", "audit:read"],
    blocked_actions: [
      "config:save_draft",
      "config:submit_review",
      "config:publish",
      "config:rollback",
      "blocklist:block",
      "blocklist:unblock",
      "release_gate:review",
      "campaign:update",
      "snapshot:export"
    ],
    requires_review: []
  }
]);

export const PHASE9_TENANTS: TenantWorkspace[] = TenantWorkspaceSchema.array().parse([
  {
    tenant_id: INTERNAL_TENANT_ID,
    name: "观相镜内部运营空间",
    tenant_type: "internal",
    status: "active",
    allowed_scenarios: ["SCN-001", "SCN-002"],
    created_at: REVIEWED_AT
  },
  {
    tenant_id: CLIENT_DEMO_TENANT_ID,
    name: "文旅客户演示空间",
    tenant_type: "client_demo",
    status: "active",
    allowed_scenarios: ["SCN-002"],
    created_at: REVIEWED_AT
  }
]);

export const PHASE9_ADMIN_ACCOUNTS: AdminAccount[] = AdminAccountSchema.array().parse([
  {
    admin_id: "ADM-001",
    tenant_id: INTERNAL_TENANT_ID,
    email: "ops@xiangmian.example",
    display_name: "Operations Lead",
    role: "operations",
    status: "active",
    last_login_at: REVIEWED_AT
  },
  {
    admin_id: "ADM-002",
    tenant_id: INTERNAL_TENANT_ID,
    email: "content@xiangmian.example",
    display_name: "Content Editor",
    role: "content",
    status: "active",
    last_login_at: REVIEWED_AT
  },
  {
    admin_id: "ADM-003",
    tenant_id: INTERNAL_TENANT_ID,
    email: "legal@xiangmian.example",
    display_name: "Legal Reviewer",
    role: "legal",
    status: "active",
    last_login_at: REVIEWED_AT
  },
  {
    admin_id: "ADM-004",
    tenant_id: INTERNAL_TENANT_ID,
    email: "viewer@xiangmian.example",
    display_name: "Read Only",
    role: "viewer",
    status: "active",
    last_login_at: REVIEWED_AT
  },
  {
    admin_id: "ADM-005",
    tenant_id: INTERNAL_TENANT_ID,
    email: "engineer@xiangmian.example",
    display_name: "Platform Engineer",
    role: "engineering",
    status: "active",
    last_login_at: REVIEWED_AT
  },
  {
    admin_id: "ADM-006",
    tenant_id: CLIENT_DEMO_TENANT_ID,
    email: "demo-ops@xiangmian.example",
    display_name: "Demo Operator",
    role: "operations",
    status: "active",
    last_login_at: REVIEWED_AT
  }
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function hashPayload(value: unknown): string {
  const text = stableStringify(value);
  const chunks: string[] = [];

  for (let seed = 0; seed < 8; seed += 1) {
    let hash = 0x811c9dc5 ^ seed;

    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }

    chunks.push((hash >>> 0).toString(16).padStart(8, "0"));
  }

  return `sha256:${chunks.join("")}`;
}

function nextAuditId(state: Phase9SaasState): string {
  return `AUD-${String(state.audit_logs.length + 1).padStart(3, "0")}`;
}

function nextSnapshotId(state: Phase9SaasState): string {
  return `SNP-${String(state.published_snapshots.length + 1).padStart(3, "0")}`;
}

function nextVersionId(state: Phase9SaasState): string {
  return `CFG-${String(state.config_versions.length + 101).padStart(3, "0")}`;
}

function tenantById(state: Phase9SaasState, tenantId: string): TenantWorkspace {
  const tenant = state.tenants.find((item) => item.tenant_id === tenantId);

  if (!tenant || tenant.status !== "active") {
    throw new Error(`Unknown or inactive tenant: ${tenantId}`);
  }

  return tenant;
}

function accountById(state: Phase9SaasState, tenantId: string, adminId: string): AdminAccount {
  const account = state.admin_accounts.find(
    (item) => item.admin_id === adminId && item.tenant_id === tenantId
  );

  if (!account || account.status !== "active") {
    throw new Error(`Unknown or inactive admin account: ${adminId}`);
  }

  return account;
}

export function roleCanPerform(role: AdminUserRole, action: SaasAdminAction): boolean {
  const policy = PHASE9_PERMISSION_POLICIES.find((item) => item.role === role);

  return Boolean(policy?.allowed_actions.includes(action) && !policy.blocked_actions.includes(action));
}

function assertPermission(
  state: Phase9SaasState,
  tenantId: string,
  adminId: string,
  action: SaasAdminAction
): AdminAccount {
  tenantById(state, tenantId);
  const account = accountById(state, tenantId, adminId);

  if (!roleCanPerform(account.role, action)) {
    throw new Error(`Permission denied for ${account.role}: ${action}`);
  }

  return account;
}

function appendAudit(
  state: Phase9SaasState,
  tenantId: string,
  account: AdminAccount,
  action: SaasAdminAction,
  targetType: SaasAuditLog["target_type"],
  targetId: string,
  before: unknown,
  after: unknown,
  reason: string
): void {
  state.audit_logs = [
    SaasAuditLogSchema.parse({
      audit_id: nextAuditId(state),
      tenant_id: tenantId,
      actor_admin_id: account.admin_id,
      actor_role: account.role,
      action_type: action,
      target_type: targetType,
      target_id: targetId,
      before_hash: before === null ? null : hashPayload(before),
      after_hash: after === null ? null : hashPayload(after),
      reason,
      created_at: REVIEWED_AT
    }),
    ...state.audit_logs
  ];
}

function getDraftEntry(state: Phase9SaasState, tenantId: string): SaasDraftStore {
  const draft = state.draft_stores.find((item) => item.tenant_id === tenantId);

  if (!draft) {
    throw new Error(`Missing draft store for tenant: ${tenantId}`);
  }

  return draft;
}

function currentVersion(state: Phase9SaasState, tenantId: string): ConfigVersionV02 {
  const draft = getDraftEntry(state, tenantId);
  const version = state.config_versions.find((item) => item.version_id === draft.config_version_id);

  if (!version) {
    throw new Error(`Missing config version: ${draft.config_version_id}`);
  }

  return version;
}

function replaceVersion(
  state: Phase9SaasState,
  tenantId: string,
  nextVersion: ConfigVersionV02
): void {
  state.config_versions = state.config_versions.map((item) =>
    item.tenant_id === tenantId && item.version_id === nextVersion.version_id ? nextVersion : item
  );
}

function replaceDraftStore(state: Phase9SaasState, tenantId: string, store: AdminConfigStore): void {
  const draft = getDraftEntry(state, tenantId);

  state.draft_stores = state.draft_stores.map((item) =>
    item.tenant_id === tenantId
      ? {
          ...item,
          store
        }
      : item
  );
  replaceVersion(
    state,
    tenantId,
    ConfigVersionV02Schema.parse({
      ...currentVersion(state, tenantId),
      status: "draft",
      checksum: hashPayload(store),
      published_at: null,
      published_by: null,
      rollback_of: null,
      version_id: draft.config_version_id
    })
  );
}

function buildConfigVersion(
  tenantId: string,
  store: AdminConfigStore,
  status: ConfigVersionV02["status"],
  parentVersionId: string | null,
  publishedBy: string | null,
  rollbackOf: string | null,
  versionId = PHASE8_CONFIG_VERSION.version_id
): ConfigVersionV02 {
  return ConfigVersionV02Schema.parse({
    ...PHASE8_CONFIG_VERSION,
    version_id: versionId,
    tenant_id: tenantId,
    parent_version_id: parentVersionId,
    status,
    checksum: hashPayload(store),
    published_at: status === "published" ? REVIEWED_AT : null,
    published_by: publishedBy,
    rollback_of: rollbackOf
  });
}

function createSnapshot(
  state: Phase9SaasState,
  tenantId: string,
  campaignId: string,
  version: ConfigVersionV02,
  store: AdminConfigStore
): PublishedConfigSnapshot {
  const campaign = store.campaigns.find((item) => item.campaign_id === campaignId);

  if (!campaign) {
    throw new Error(`Unknown campaign for snapshot: ${campaignId}`);
  }

  const theme = store.themes.find((item) => item.theme_id === campaign.theme_id) ?? getCampaignThemePack(campaignId);

  return PublishedConfigSnapshotSchema.parse({
    snapshot_id: nextSnapshotId(state),
    tenant_id: tenantId,
    campaign_id: campaign.campaign_id,
    config_version_id: version.version_id,
    campaign,
    theme,
    blocklist: store.card_blocklist,
    generated_at: REVIEWED_AT
  });
}

export function assertPhase9PrivacyBoundary(payload: unknown): boolean {
  return assertPhase8PrivacyBoundary(payload);
}

export function createAnonymousMetricsEventV02(input: AnonymousMetricsEventV02): AnonymousMetricsEventV02 {
  return AnonymousMetricsEventV02Schema.parse(input);
}

export function aggregatePhase9MetricsEvents(
  campaignId: string,
  events: AnonymousMetricsEventV02[]
): AdminMetricsSnapshot {
  const campaignEvents = events.filter((event) => event.campaign_id === campaignId);
  const viewedCount = campaignEvents.filter((event) => event.event_type === "campaign_viewed").length;
  const cardDrawnCount = campaignEvents.filter((event) => event.event_type === "card_drawn").length;
  const manualSelectedCount = campaignEvents.filter((event) => event.event_type === "manual_mode_selected").length;
  const manualDrawnCount = campaignEvents.filter(
    (event) => event.event_type === "card_drawn" && event.trigger === "manual_draw"
  ).length;
  const actionDetectedCount = campaignEvents.filter((event) => event.event_type === "action_detected").length;
  const actionTimeoutCount = campaignEvents.filter(
    (event) => event.event_type === "fallback_triggered" && event.fallback_reason === "action_timeout"
  ).length;
  const posterGeneratedCount = campaignEvents.filter((event) => event.event_type === "poster_generated").length;
  const shareClickedCount = campaignEvents.filter((event) => event.event_type === "share_clicked").length;

  const rate = (numerator: number, denominator: number): number =>
    denominator === 0 ? 0 : Number((numerator / denominator).toFixed(2));

  return AdminMetricsSnapshotSchema.parse({
    campaign_id: campaignId,
    completion_rate: rate(cardDrawnCount, viewedCount),
    manual_completion_rate: rate(manualDrawnCount, manualSelectedCount),
    action_success_rate: rate(actionDetectedCount, actionDetectedCount + actionTimeoutCount),
    poster_generation_rate: rate(posterGeneratedCount, cardDrawnCount),
    share_click_rate: rate(shareClickedCount, cardDrawnCount),
    negative_feedback_count: 0,
    updated_at: REVIEWED_AT
  });
}

export function migratePhase8StoreToSaas(seedStore = createPhase8AdminConfigStore()): Phase9SaasState {
  const internalVersion = buildConfigVersion(
    INTERNAL_TENANT_ID,
    seedStore,
    "draft",
    null,
    null,
    null,
    "CFG-101"
  );
  const demoVersion = buildConfigVersion(
    CLIENT_DEMO_TENANT_ID,
    seedStore,
    "draft",
    null,
    null,
    null,
    "CFG-102"
  );

  return {
    tenants: PHASE9_TENANTS,
    admin_accounts: PHASE9_ADMIN_ACCOUNTS,
    permission_policies: PHASE9_PERMISSION_POLICIES,
    config_versions: [internalVersion, demoVersion],
    draft_stores: [
      {
        tenant_id: INTERNAL_TENANT_ID,
        config_version_id: internalVersion.version_id,
        store: seedStore
      },
      {
        tenant_id: CLIENT_DEMO_TENANT_ID,
        config_version_id: demoVersion.version_id,
        store: seedStore
      }
    ],
    published_snapshots: [],
    audit_logs: [
      SaasAuditLogSchema.parse({
        audit_id: "AUD-001",
        tenant_id: INTERNAL_TENANT_ID,
        actor_admin_id: "ADM-005",
        actor_role: "engineering",
        action_type: "config:save_draft",
        target_type: "config_version",
        target_id: internalVersion.version_id,
        before_hash: null,
        after_hash: hashPayload(seedStore),
        reason: "Migrate Phase 8 AdminConfigStore into the Phase 9 SaaS repository.",
        created_at: REVIEWED_AT
      })
    ],
    metrics_events: []
  };
}

export function createPhase9Repository(seedStore = createPhase8AdminConfigStore()): Phase9Repository {
  let state = migratePhase8StoreToSaas(seedStore);

  const repository: Phase9Repository = {
    loadDraft: (tenantId) => {
      assertPermission(state, tenantId, accountById(state, tenantId, firstAccountIdForTenant(state, tenantId)).admin_id, "config:read");
      return getDraftEntry(state, tenantId).store;
    },
    saveDraft: (tenantId, store, actorAdminId, reason) => {
      const account = assertPermission(state, tenantId, actorAdminId, "config:save_draft");
      const before = getDraftEntry(state, tenantId).store;

      if (!assertPhase9PrivacyBoundary(store)) {
        throw new Error("Cannot save draft with forbidden privacy fields.");
      }

      replaceDraftStore(state, tenantId, store);
      appendAudit(state, tenantId, account, "config:save_draft", "config_version", currentVersion(state, tenantId).version_id, before, store, reason);
      return store;
    },
    submitReview: (tenantId, actorAdminId, reason) => {
      const account = assertPermission(state, tenantId, actorAdminId, "config:submit_review");
      const version = currentVersion(state, tenantId);
      const nextVersion = ConfigVersionV02Schema.parse({
        ...version,
        status: "review"
      });

      replaceVersion(state, tenantId, nextVersion);
      appendAudit(state, tenantId, account, "config:submit_review", "config_version", version.version_id, version, nextVersion, reason);
      return nextVersion;
    },
    publish: (tenantId, actorAdminId, campaignId, reason) => {
      const account = assertPermission(state, tenantId, actorAdminId, "config:publish");
      const draft = getDraftEntry(state, tenantId);
      const store = draft.store;

      if (!assertPhase9PrivacyBoundary(store)) {
        throw new Error("Cannot publish snapshot with forbidden privacy fields.");
      }
      if (store.release_gates.some((gate) => gate.status !== "pass")) {
        throw new Error("Cannot publish until every release gate passes.");
      }

      const version = currentVersion(state, tenantId);
      const publishedVersion = ConfigVersionV02Schema.parse({
        ...version,
        status: "published",
        published_at: REVIEWED_AT,
        published_by: account.admin_id,
        checksum: hashPayload(store)
      });
      const snapshot = createSnapshot(state, tenantId, campaignId, publishedVersion, store);

      replaceVersion(state, tenantId, publishedVersion);
      state.published_snapshots = [snapshot, ...state.published_snapshots];
      appendAudit(state, tenantId, account, "config:publish", "published_snapshot", snapshot.snapshot_id, null, snapshot, reason);
      return snapshot;
    },
    rollback: (tenantId, actorAdminId, snapshotId, reason) => {
      const account = assertPermission(state, tenantId, actorAdminId, "config:rollback");
      const target = state.published_snapshots.find(
        (snapshot) => snapshot.tenant_id === tenantId && snapshot.snapshot_id === snapshotId
      );

      if (!target) {
        throw new Error(`Unknown published snapshot: ${snapshotId}`);
      }

      const store = getDraftEntry(state, tenantId).store;
      const rollbackVersion = buildConfigVersion(
        tenantId,
        store,
        "published",
        currentVersion(state, tenantId).version_id,
        account.admin_id,
        target.config_version_id,
        nextVersionId(state)
      );
      const rollbackSnapshot = PublishedConfigSnapshotSchema.parse({
        ...target,
        snapshot_id: nextSnapshotId(state),
        config_version_id: rollbackVersion.version_id,
        generated_at: REVIEWED_AT
      });

      state.config_versions = [rollbackVersion, ...state.config_versions];
      state.published_snapshots = [rollbackSnapshot, ...state.published_snapshots];
      appendAudit(state, tenantId, account, "config:rollback", "published_snapshot", rollbackSnapshot.snapshot_id, target, rollbackSnapshot, reason);
      return rollbackSnapshot;
    },
    exportSnapshot: (tenantId, campaignId) => getPublishedSnapshotForCampaign(state, tenantId, campaignId),
    blockCard: (tenantId, actorAdminId, cardId, reason, notes) => {
      const account = assertPermission(state, tenantId, actorAdminId, "blocklist:block");
      const before = getDraftEntry(state, tenantId).store;
      const nextStore = addCardToAdminBlocklist(before, cardId, account.role, reason, notes);

      replaceDraftStore(state, tenantId, nextStore);
      appendAudit(state, tenantId, account, "blocklist:block", "card_blocklist", cardId, before.card_blocklist, nextStore.card_blocklist, reason);
      return nextStore;
    },
    reviewReleaseGate: (tenantId, actorAdminId, gateId, status, evidence, blockerReason) => {
      const account = assertPermission(state, tenantId, actorAdminId, "release_gate:review");
      const before = getDraftEntry(state, tenantId).store;
      const nextStore = updateAdminReleaseGate(before, gateId, status, account.role, evidence, blockerReason);

      replaceDraftStore(state, tenantId, nextStore);
      appendAudit(state, tenantId, account, "release_gate:review", "release_gate", gateId, before.release_gates, nextStore.release_gates, evidence);
      return nextStore;
    },
    updateCampaignStatus: (tenantId, actorAdminId, campaignId, releaseStatus, reason) => {
      const account = assertPermission(state, tenantId, actorAdminId, "campaign:update");
      const before = getDraftEntry(state, tenantId).store;
      const nextStore = updateAdminCampaignStatus(before, campaignId, releaseStatus, account.role, reason);

      replaceDraftStore(state, tenantId, nextStore);
      appendAudit(state, tenantId, account, "campaign:update", "campaign", campaignId, before.campaigns, nextStore.campaigns, reason);
      return nextStore;
    },
    getState: () => state
  };

  return repository;
}

function firstAccountIdForTenant(state: Phase9SaasState, tenantId: string): string {
  const account = state.admin_accounts.find((item) => item.tenant_id === tenantId && item.status === "active");

  if (!account) {
    throw new Error(`Missing active account for tenant: ${tenantId}`);
  }

  return account.admin_id;
}

export function getPublishedSnapshotForCampaign(
  state: Phase9SaasState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot | null {
  return (
    state.published_snapshots.find(
      (snapshot) => snapshot.tenant_id === tenantId && snapshot.campaign_id === campaignId
    ) ?? null
  );
}

export function buildPhase9SaasReport(state: Phase9SaasState): Phase9SaasReport {
  const permissionCheckPassed =
    !roleCanPerform("viewer", "config:save_draft") &&
    !roleCanPerform("content", "config:publish") &&
    roleCanPerform("legal", "release_gate:review") &&
    roleCanPerform("operations", "blocklist:block");
  const privacyCheckPassed = assertPhase9PrivacyBoundary(state);
  const migrationCheckPassed =
    state.tenants.length >= 2 &&
    state.draft_stores.every((draft) => draft.store.campaigns.length >= 2) &&
    state.draft_stores.every((draft) => draft.store.themes.length >= 2);

  return Phase9SaasReportSchema.parse({
    tenant_count: state.tenants.length,
    published_snapshot_count: state.published_snapshots.length,
    audit_count: state.audit_logs.length,
    permission_check_passed: permissionCheckPassed,
    privacy_check_passed: privacyCheckPassed,
    migration_check_passed: migrationCheckPassed,
    go_no_go_decision:
      permissionCheckPassed && privacyCheckPassed && migrationCheckPassed && state.published_snapshots.length >= 2
        ? "go"
        : "hold"
  });
}

function createPublishedSampleState(): Phase9SaasState {
  const repository = createPhase9Repository();
  const draft = repository.loadDraft(INTERNAL_TENANT_ID);

  if (!draft) {
    throw new Error("Missing internal draft store.");
  }

  repository.submitReview(INTERNAL_TENANT_ID, "ADM-005", "Engineering review passed for sample SaaS snapshots.");
  for (const campaign of draft.campaigns) {
    repository.publish(
      INTERNAL_TENANT_ID,
      "ADM-005",
      campaign.campaign_id,
      `Publish sample snapshot for ${campaign.campaign_id}.`
    );
  }

  const state = repository.getState();
  state.metrics_events = [
    createAnonymousMetricsEventV02({
      event_type: "campaign_viewed",
      campaign_id: "CMP-001",
      session_step: "entry",
      duration_bucket: "30_90s",
      timestamp: 1_770_000_000_001
    }),
    createAnonymousMetricsEventV02({
      event_type: "manual_mode_selected",
      campaign_id: "CMP-001",
      session_step: "drawing",
      trigger: "manual_draw",
      duration_bucket: "30_90s",
      timestamp: 1_770_000_000_002
    }),
    createAnonymousMetricsEventV02({
      event_type: "card_drawn",
      campaign_id: "CMP-001",
      session_step: "result",
      trigger: "manual_draw",
      card_group: "手动问镜",
      duration_bucket: "30_90s",
      timestamp: 1_770_000_000_003
    }),
    createAnonymousMetricsEventV02({
      event_type: "poster_generated",
      campaign_id: "CMP-001",
      session_step: "result",
      trigger: "manual_draw",
      card_group: "手动问镜",
      duration_bucket: "30_90s",
      timestamp: 1_770_000_000_004
    }),
    createAnonymousMetricsEventV02({
      event_type: "share_clicked",
      campaign_id: "CMP-001",
      session_step: "result",
      trigger: "manual_draw",
      card_group: "手动问镜",
      duration_bucket: "30_90s",
      timestamp: 1_770_000_000_005
    })
  ];

  return state;
}

export function getPublishedCampaignCards(
  state: Phase9SaasState,
  tenantId: string,
  campaignId: string
) {
  const snapshot = getPublishedSnapshotForCampaign(state, tenantId, campaignId);

  return getThemeCardsForCampaign(campaignId, snapshot?.blocklist ?? ([] as CardBlocklist[]));
}

export const samplePhase9SaasState = createPublishedSampleState();
export const samplePhase9SaasReport = buildPhase9SaasReport(samplePhase9SaasState);
export const samplePhase9MetricsSnapshot = aggregatePhase9MetricsEvents(
  "CMP-001",
  samplePhase9SaasState.metrics_events
);
export const phase9DefaultTenantId = INTERNAL_TENANT_ID;
