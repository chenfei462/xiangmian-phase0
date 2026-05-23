import {
  Phase10PilotReportSchema,
  PilotMetricsSummarySchema,
  PilotReleaseSchema,
  PilotTenantSchema,
  PrivacyScanResultSchema,
  ProductionAuditPolicySchema,
  SaasEnvironmentSchema,
  type Phase10PilotReport,
  type PilotMetricsSummary,
  type PilotRelease,
  type PilotTenant,
  type PrivacyScanResult,
  type ProductionAuditPolicy,
  type SaasEnvironment
} from "./phase10-contracts";
import {
  PublishedConfigSnapshotSchema,
  SaasAuditLogSchema,
  type AdminAccount,
  type Phase9SaasReport,
  type PublishedConfigSnapshot,
  type SaasAuditLog
} from "./phase9-contracts";
import {
  aggregatePhase9MetricsEvents,
  assertPhase9PrivacyBoundary,
  buildPhase9SaasReport,
  hashPayload,
  phase9DefaultTenantId,
  samplePhase9SaasState,
  type Phase9SaasState
} from "./phase9-saas";

const REVIEWED_AT = "2026-05-01T00:00:00.000Z";
const INTERNAL_TENANT_ID = phase9DefaultTenantId;
const CLIENT_PILOT_TENANT_ID = "TEN-002";
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

export type Phase10PilotState = {
  pilot_tenants: PilotTenant[];
  environments: SaasEnvironment[];
  pilot_releases: PilotRelease[];
  audit_policies: ProductionAuditPolicy[];
  privacy_scans: PrivacyScanResult[];
  metrics_summaries: PilotMetricsSummary[];
  phase9_state: Phase9SaasState;
};

export const PHASE10_ENVIRONMENTS: SaasEnvironment[] = SaasEnvironmentSchema.array().parse([
  {
    environment_id: "ENV-001",
    name: "Internal staging",
    release_channel: "staging",
    database_mode: "postgres_compatible",
    snapshot_source: "published_snapshot",
    metrics_mode: "fixture"
  },
  {
    environment_id: "ENV-002",
    name: "Controlled customer pilot",
    release_channel: "pilot",
    database_mode: "postgres_compatible",
    snapshot_source: "published_snapshot",
    metrics_mode: "anonymous_ingestion"
  }
]);

export const PHASE10_PILOT_TENANTS: PilotTenant[] = PilotTenantSchema.array().parse([
  {
    tenant_id: INTERNAL_TENANT_ID,
    client_name: "Internal staging team",
    pilot_status: "pilot",
    started_at: REVIEWED_AT,
    ended_at: null,
    enabled_campaign_ids: ["CMP-001", "CMP-002"],
    operator_contact: "ops@xiangmian.example",
    privacy_owner: "privacy@xiangmian.example"
  },
  {
    tenant_id: CLIENT_PILOT_TENANT_ID,
    client_name: "Controlled cultural tourism client",
    pilot_status: "staging",
    started_at: REVIEWED_AT,
    ended_at: null,
    enabled_campaign_ids: ["CMP-002"],
    operator_contact: "client-ops@xiangmian.example",
    privacy_owner: "client-privacy@xiangmian.example"
  }
]);

export const PHASE10_AUDIT_POLICIES: ProductionAuditPolicy[] =
  ProductionAuditPolicySchema.array().parse([
    {
      target_type: "published_snapshot",
      required_actions: ["config:publish", "config:rollback", "snapshot:export"],
      retention_days: 365,
      hash_only_fields: ["before", "after", "snapshot_payload"],
      export_allowed: true
    },
    {
      target_type: "card_blocklist",
      required_actions: ["blocklist:block", "blocklist:unblock"],
      retention_days: 365,
      hash_only_fields: ["before", "after", "card_payload"],
      export_allowed: true
    },
    {
      target_type: "release_gate",
      required_actions: ["release_gate:review"],
      retention_days: 365,
      hash_only_fields: ["before", "after", "evidence_payload"],
      export_allowed: true
    },
    {
      target_type: "campaign",
      required_actions: ["campaign:update"],
      retention_days: 180,
      hash_only_fields: ["before", "after"],
      export_allowed: true
    },
    {
      target_type: "metrics",
      required_actions: ["metrics:read"],
      retention_days: 180,
      hash_only_fields: ["event_payload"],
      export_allowed: false
    }
  ]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clonePhase9State(state: Phase9SaasState): Phase9SaasState {
  return JSON.parse(JSON.stringify(state)) as Phase9SaasState;
}

function clonePhase10State(state: Phase10PilotState): Phase10PilotState {
  return JSON.parse(JSON.stringify(state)) as Phase10PilotState;
}

function nextAuditId(state: Phase9SaasState): string {
  return `AUD-${String(state.audit_logs.length + 1).padStart(3, "0")}`;
}

function collectForbiddenPrivacyFields(value: unknown, path = "$"): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectForbiddenPrivacyFields(item, `${path}[${index}]`));
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const fieldPath = `${path}.${key}`;
    const current = FORBIDDEN_PRIVACY_FIELDS.has(key) ? [fieldPath] : [];

    return [...current, ...collectForbiddenPrivacyFields(nested, fieldPath)];
  });
}

function accountById(state: Phase9SaasState, adminId: string): AdminAccount {
  const account = state.admin_accounts.find((item) => item.admin_id === adminId);

  if (!account) {
    throw new Error(`Unknown admin account: ${adminId}`);
  }

  return account;
}

function appendPilotAudit(
  state: Phase9SaasState,
  account: AdminAccount,
  action: SaasAuditLog["action_type"],
  targetType: SaasAuditLog["target_type"],
  targetId: string,
  before: unknown,
  after: unknown,
  reason: string
): void {
  state.audit_logs = [
    SaasAuditLogSchema.parse({
      audit_id: nextAuditId(state),
      tenant_id: account.tenant_id,
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

function findSnapshot(
  state: Phase9SaasState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot {
  const snapshot = state.published_snapshots.find(
    (item) => item.tenant_id === tenantId && item.campaign_id === campaignId
  );

  if (!snapshot) {
    throw new Error(`Missing published snapshot for ${tenantId}/${campaignId}`);
  }

  return snapshot;
}

function buildPilotReleases(phase9State: Phase9SaasState): PilotRelease[] {
  const qiancheng = findSnapshot(phase9State, INTERNAL_TENANT_ID, "CMP-001");
  const shanhe = findSnapshot(phase9State, INTERNAL_TENANT_ID, "CMP-002");

  return PilotReleaseSchema.array().parse([
    {
      release_id: "REL-001",
      tenant_id: INTERNAL_TENANT_ID,
      campaign_id: qiancheng.campaign_id,
      snapshot_id: qiancheng.snapshot_id,
      status: "pilot",
      released_by: "ADM-005",
      released_at: REVIEWED_AT,
      rollback_snapshot_id: null
    },
    {
      release_id: "REL-002",
      tenant_id: INTERNAL_TENANT_ID,
      campaign_id: shanhe.campaign_id,
      snapshot_id: shanhe.snapshot_id,
      status: "pilot",
      released_by: "ADM-005",
      released_at: REVIEWED_AT,
      rollback_snapshot_id: null
    },
    {
      release_id: "REL-003",
      tenant_id: INTERNAL_TENANT_ID,
      campaign_id: qiancheng.campaign_id,
      snapshot_id: qiancheng.snapshot_id,
      status: "rolled_back",
      released_by: "ADM-005",
      released_at: REVIEWED_AT,
      rollback_snapshot_id: qiancheng.snapshot_id
    }
  ]);
}

export function scanPhase10Privacy(
  targetId: string,
  targetType: PrivacyScanResult["target_type"],
  payload: unknown
): PrivacyScanResult {
  const forbiddenFields = collectForbiddenPrivacyFields(payload);
  const passed = forbiddenFields.length === 0 && assertPhase9PrivacyBoundary(payload);

  return PrivacyScanResultSchema.parse({
    target_id: targetId,
    target_type: targetType,
    forbidden_fields: forbiddenFields,
    passed,
    scanned_at: REVIEWED_AT
  });
}

export function createPilotMetricsSummary(
  tenantId: string,
  campaignId: string,
  phase9State: Phase9SaasState
): PilotMetricsSummary {
  const metrics = aggregatePhase9MetricsEvents(campaignId, phase9State.metrics_events);
  const sampleSize = phase9State.metrics_events.filter((event) => event.campaign_id === campaignId).length;

  return PilotMetricsSummarySchema.parse({
    tenant_id: tenantId,
    campaign_id: campaignId,
    sample_size: sampleSize,
    completion_rate: metrics.completion_rate,
    manual_completion_rate: metrics.manual_completion_rate,
    action_success_rate: metrics.action_success_rate,
    poster_generation_rate: metrics.poster_generation_rate,
    negative_feedback_count: metrics.negative_feedback_count
  });
}

export function migratePhase9ToPilotState(
  seedState = samplePhase9SaasState
): Phase10PilotState {
  const phase9State = clonePhase9State(seedState);
  const pilotReleases = buildPilotReleases(phase9State);
  const rollbackAccount = accountById(phase9State, "ADM-005");

  appendPilotAudit(
    phase9State,
    rollbackAccount,
    "config:rollback",
    "published_snapshot",
    pilotReleases[2].snapshot_id,
    pilotReleases[0],
    pilotReleases[2],
    "Phase 10 rollback drill for controlled pilot readiness."
  );

  const privacyScans = [
    ...phase9State.published_snapshots.map((snapshot) =>
      scanPhase10Privacy(snapshot.snapshot_id, "published_snapshot", snapshot)
    ),
    ...phase9State.audit_logs.map((audit) => scanPhase10Privacy(audit.audit_id, "config_version", audit)),
    ...pilotReleases.map((release) => scanPhase10Privacy(release.release_id, "pilot_release", release)),
    scanPhase10Privacy("METRICS-PHASE10", "metrics", phase9State.metrics_events)
  ];
  const activeReleases = pilotReleases.filter((release) => release.status === "pilot");

  return {
    pilot_tenants: PHASE10_PILOT_TENANTS,
    environments: PHASE10_ENVIRONMENTS,
    pilot_releases: pilotReleases,
    audit_policies: PHASE10_AUDIT_POLICIES,
    privacy_scans: PrivacyScanResultSchema.array().parse(privacyScans),
    metrics_summaries: PilotMetricsSummarySchema.array().parse(
      activeReleases.map((release) =>
        createPilotMetricsSummary(release.tenant_id, release.campaign_id, phase9State)
      )
    ),
    phase9_state: phase9State
  };
}

export function getActivePilotSnapshot(
  state: Phase10PilotState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot | null {
  const tenant = state.pilot_tenants.find((item) => item.tenant_id === tenantId);

  if (!tenant || ["paused", "rolled_back", "completed"].includes(tenant.pilot_status)) {
    return null;
  }

  const release = state.pilot_releases.find(
    (item) =>
      item.tenant_id === tenantId &&
      item.campaign_id === campaignId &&
      item.status === "pilot"
  );

  if (!release) {
    return null;
  }

  const snapshot =
    state.phase9_state.published_snapshots.find(
      (item) =>
        item.tenant_id === tenantId &&
        item.campaign_id === campaignId &&
        item.snapshot_id === release.snapshot_id
    ) ?? null;

  return snapshot ? PublishedConfigSnapshotSchema.parse(snapshot) : null;
}

export function pausePilotRelease(
  state: Phase10PilotState,
  releaseId: string,
  actorAdminId: string,
  reason: string
): Phase10PilotState {
  const nextState = clonePhase10State(state);
  const release = nextState.pilot_releases.find((item) => item.release_id === releaseId);

  if (!release) {
    throw new Error(`Unknown pilot release: ${releaseId}`);
  }

  const before = { ...release };
  release.status = "paused";
  const account = accountById(nextState.phase9_state, actorAdminId);
  appendPilotAudit(
    nextState.phase9_state,
    account,
    "campaign:update",
    "campaign",
    release.campaign_id,
    before,
    release,
    reason
  );

  return nextState;
}

export function rollbackPilotRelease(
  state: Phase10PilotState,
  releaseId: string,
  rollbackSnapshotId: string,
  actorAdminId: string,
  reason: string
): Phase10PilotState {
  const nextState = clonePhase10State(state);
  const release = nextState.pilot_releases.find((item) => item.release_id === releaseId);

  if (!release) {
    throw new Error(`Unknown pilot release: ${releaseId}`);
  }
  if (
    !nextState.phase9_state.published_snapshots.some(
      (snapshot) =>
        snapshot.tenant_id === release.tenant_id &&
        snapshot.campaign_id === release.campaign_id &&
        snapshot.snapshot_id === rollbackSnapshotId
    )
  ) {
    throw new Error(`Unknown rollback snapshot: ${rollbackSnapshotId}`);
  }

  const before = { ...release };
  release.status = "rolled_back";
  release.rollback_snapshot_id = rollbackSnapshotId;
  const account = accountById(nextState.phase9_state, actorAdminId);
  appendPilotAudit(
    nextState.phase9_state,
    account,
    "config:rollback",
    "published_snapshot",
    rollbackSnapshotId,
    before,
    release,
    reason
  );

  return nextState;
}

export function buildPostgresSchemaPreview(): string {
  return [
    "create table pilot_tenants (tenant_id text primary key, client_name text not null, pilot_status text not null, started_at timestamptz not null, ended_at timestamptz, enabled_campaign_ids jsonb not null, operator_contact text not null, privacy_owner text not null);",
    "create table saas_environments (environment_id text primary key, name text not null, release_channel text not null, database_mode text not null, snapshot_source text not null, metrics_mode text not null);",
    "create table pilot_releases (release_id text primary key, tenant_id text not null, campaign_id text not null, snapshot_id text not null, status text not null, released_by text not null, released_at timestamptz not null, rollback_snapshot_id text);",
    "create table production_audit_policies (target_type text primary key, required_actions jsonb not null, retention_days integer not null, hash_only_fields jsonb not null, export_allowed boolean not null);",
    "create table privacy_scan_results (target_id text not null, target_type text not null, forbidden_fields jsonb not null, passed boolean not null, scanned_at timestamptz not null);",
    "create table pilot_metrics_summaries (tenant_id text not null, campaign_id text not null, sample_size integer not null, completion_rate numeric not null, manual_completion_rate numeric not null, action_success_rate numeric not null, poster_generation_rate numeric not null, negative_feedback_count integer not null);"
  ].join("\n");
}

export function buildPhase10PilotReport(state: Phase10PilotState): Phase10PilotReport {
  const phase9Report: Phase9SaasReport = buildPhase9SaasReport(state.phase9_state);
  const rollbackDrillPassed = state.pilot_releases.some(
    (release) => release.status === "rolled_back" && release.rollback_snapshot_id !== null
  );
  const privacyCheckPassed =
    state.privacy_scans.every((scan) => scan.passed) && assertPhase9PrivacyBoundary(state);
  const auditCheckPassed =
    state.audit_policies.length >= 5 &&
    state.phase9_state.audit_logs.every(
      (audit) => audit.reason.length > 0 && (audit.before_hash !== null || audit.after_hash !== null)
    );
  const ready =
    phase9Report.go_no_go_decision === "go" &&
    state.pilot_tenants.length >= 2 &&
    state.pilot_releases.filter((release) => release.status === "pilot").length >= 2 &&
    rollbackDrillPassed &&
    privacyCheckPassed &&
    auditCheckPassed;

  return Phase10PilotReportSchema.parse({
    tenant_count: state.pilot_tenants.length,
    pilot_release_count: state.pilot_releases.length,
    rollback_drill_passed: rollbackDrillPassed,
    privacy_check_passed: privacyCheckPassed,
    audit_check_passed: auditCheckPassed,
    customer_feedback_summary:
      "Controlled pilot is ready for one internal staging run and one client demonstration run; no hardware integration or public registration is enabled.",
    go_no_go_decision: ready ? "go" : "hold"
  });
}

export const samplePhase10PilotState = migratePhase9ToPilotState();
export const samplePhase10PilotReport = buildPhase10PilotReport(samplePhase10PilotState);
export const samplePhase10PostgresSchema = buildPostgresSchemaPreview();
export const phase10ActivePilotSnapshot = getActivePilotSnapshot(
  samplePhase10PilotState,
  INTERNAL_TENANT_ID,
  "CMP-001"
);
