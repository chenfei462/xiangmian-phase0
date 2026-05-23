import {
  AdminAuthSessionSchema,
  CommercialExportPackageSchema,
  CommercialTenantSchema,
  CustomerOnboardingChecklistSchema,
  ManagedDatabaseStatusSchema,
  Phase11CommercialReportSchema,
  SupportIncidentSchema,
  TenantPermissionCheckSchema,
  type AdminAuthSession,
  type CommercialExportPackage,
  type CommercialTenant,
  type CustomerOnboardingChecklist,
  type ManagedDatabaseStatus,
  type Phase11CommercialReport,
  type SupportIncident,
  type TenantPermissionCheck
} from "./phase11-contracts";
import type { AdminUserRole } from "./phase8-contracts";
import {
  type PublishedConfigSnapshot,
  type SaasAdminAction,
  type SaasTargetType
} from "./phase9-contracts";
import {
  assertPhase9PrivacyBoundary,
  phase9DefaultTenantId,
  roleCanPerform
} from "./phase9-saas";
import { buildPhase10PilotReport, getActivePilotSnapshot, samplePhase10PilotState, scanPhase10Privacy, type Phase10PilotState } from "./phase10-pilot";
import type { Phase10TargetType } from "./phase10-contracts";

const REVIEWED_AT = "2026-05-01T00:00:00.000Z";
const EXPIRES_AT = "2026-05-08T00:00:00.000Z";
const INTERNAL_TENANT_ID = phase9DefaultTenantId;
const CLIENT_TENANT_ID = "TEN-002";

export type Phase11CommercialState = {
  commercial_tenants: CommercialTenant[];
  auth_sessions: AdminAuthSession[];
  permission_checks: TenantPermissionCheck[];
  managed_databases: ManagedDatabaseStatus[];
  onboarding_checklists: CustomerOnboardingChecklist[];
  export_packages: CommercialExportPackage[];
  support_incidents: SupportIncident[];
  privacy_scans: ReturnType<typeof scanPhase10Privacy>[];
  phase10_state: Phase10PilotState;
};

export const PHASE11_COMMERCIAL_TENANTS: CommercialTenant[] = CommercialTenantSchema.array().parse([
  {
    tenant_id: INTERNAL_TENANT_ID,
    client_name: "Internal commercial staging",
    commercial_status: "active",
    service_tier: "enterprise_trial",
    enabled_campaign_ids: ["CMP-001", "CMP-002"],
    allowed_campaign_count: 4,
    support_owner: "support@xiangmian.example",
    privacy_owner: "privacy@xiangmian.example",
    data_region: "cn",
    started_at: REVIEWED_AT,
    ended_at: null
  },
  {
    tenant_id: CLIENT_TENANT_ID,
    client_name: "Controlled B-side culture client",
    commercial_status: "active",
    service_tier: "professional",
    enabled_campaign_ids: ["CMP-002"],
    allowed_campaign_count: 2,
    support_owner: "client-support@xiangmian.example",
    privacy_owner: "client-privacy@xiangmian.example",
    data_region: "cn",
    started_at: REVIEWED_AT,
    ended_at: null
  }
]);

export const PHASE11_AUTH_SESSIONS: AdminAuthSession[] = AdminAuthSessionSchema.array().parse([
  {
    session_id: "SESS-001",
    admin_id: "ADM-005",
    tenant_id: INTERNAL_TENANT_ID,
    role: "engineering",
    issued_at: REVIEWED_AT,
    expires_at: EXPIRES_AT,
    mfa_required: true,
    status: "active"
  },
  {
    session_id: "SESS-002",
    admin_id: "ADM-001",
    tenant_id: INTERNAL_TENANT_ID,
    role: "operations",
    issued_at: REVIEWED_AT,
    expires_at: EXPIRES_AT,
    mfa_required: true,
    status: "active"
  },
  {
    session_id: "SESS-003",
    admin_id: "ADM-004",
    tenant_id: INTERNAL_TENANT_ID,
    role: "viewer",
    issued_at: REVIEWED_AT,
    expires_at: EXPIRES_AT,
    mfa_required: false,
    status: "active"
  },
  {
    session_id: "SESS-004",
    admin_id: "ADM-006",
    tenant_id: CLIENT_TENANT_ID,
    role: "operations",
    issued_at: REVIEWED_AT,
    expires_at: EXPIRES_AT,
    mfa_required: true,
    status: "active"
  }
]);

export const PHASE11_MANAGED_DATABASES: ManagedDatabaseStatus[] =
  ManagedDatabaseStatusSchema.array().parse([
    {
      database_id: "DB-001",
      environment: "commercial",
      migration_version: "phase11-commercial-v0.1",
      backup_status: "completed",
      last_backup_at: REVIEWED_AT,
      last_restore_drill_at: REVIEWED_AT,
      restore_drill_passed: true
    },
    {
      database_id: "DB-002",
      environment: "restore_drill",
      migration_version: "phase11-commercial-v0.1",
      backup_status: "completed",
      last_backup_at: REVIEWED_AT,
      last_restore_drill_at: REVIEWED_AT,
      restore_drill_passed: true
    }
  ]);

export const PHASE11_ONBOARDING_CHECKLISTS: CustomerOnboardingChecklist[] =
  CustomerOnboardingChecklistSchema.array().parse([
    {
      tenant_id: INTERNAL_TENANT_ID,
      owner_role: "operations",
      status: "complete",
      evidence: "Internal staging account, privacy owner, and release checklist are ready.",
      completed_at: REVIEWED_AT,
      items: [
        {
          item_id: "ONB-ITEM-001",
          label: "Account opened manually",
          status: "complete",
          evidence: "Admin sessions SESS-001 through SESS-003 seeded."
        },
        {
          item_id: "ONB-ITEM-002",
          label: "Release gate reviewed",
          status: "complete",
          evidence: "Phase 10 release gates passed before commercialization hardening."
        }
      ]
    },
    {
      tenant_id: CLIENT_TENANT_ID,
      owner_role: "operations",
      status: "complete",
      evidence: "Client support, privacy owner, and campaign limit are configured.",
      completed_at: REVIEWED_AT,
      items: [
        {
          item_id: "ONB-ITEM-003",
          label: "Client operator trained",
          status: "complete",
          evidence: "SOP rehearsal completed for blocklist, pause, rollback, and export."
        },
        {
          item_id: "ONB-ITEM-004",
          label: "Commercial scope acknowledged",
          status: "complete",
          evidence: "No public signup, billing, or hardware integration in Phase 11."
        }
      ]
    }
  ]);

export const PHASE11_SUPPORT_INCIDENTS: SupportIncident[] = SupportIncidentSchema.array().parse([
  {
    incident_id: "INC-001",
    tenant_id: CLIENT_TENANT_ID,
    severity: "sev3",
    category: "customer_ops",
    status: "resolved",
    reported_at: REVIEWED_AT,
    resolved_at: REVIEWED_AT,
    root_cause: "Customer operator needed clearer rollback ownership wording during rehearsal.",
    follow_up_actions: ["Add rollback owner to onboarding checklist", "Keep engineering as rollback executor"]
  }
]);

function clonePhase10State(state: Phase10PilotState): Phase10PilotState {
  return JSON.parse(JSON.stringify(state)) as Phase10PilotState;
}

function accountRole(state: Phase11CommercialState, tenantId: string, adminId: string): AdminUserRole | null {
  const activeSession = state.auth_sessions.find(
    (session) =>
      session.tenant_id === tenantId &&
      session.admin_id === adminId &&
      session.status === "active"
  );

  return activeSession?.role ?? null;
}

function onboardingComplete(state: Phase11CommercialState, tenantId: string): boolean {
  return state.onboarding_checklists.some(
    (checklist) =>
      checklist.tenant_id === tenantId &&
      checklist.status === "complete" &&
      checklist.items.every((item) => item.status === "complete")
  );
}

function commercialTenantReady(state: Phase11CommercialState, tenantId: string, campaignId: string): boolean {
  const tenant = state.commercial_tenants.find((item) => item.tenant_id === tenantId);

  return Boolean(
    tenant &&
      tenant.commercial_status === "active" &&
      tenant.enabled_campaign_ids.includes(campaignId) &&
      tenant.enabled_campaign_ids.length <= tenant.allowed_campaign_count &&
      onboardingComplete(state, tenantId)
  );
}

export function assertPhase11PrivacyBoundary(payload: unknown): boolean {
  return assertPhase9PrivacyBoundary(payload) && scanPhase10Privacy("PRIVACY-PHASE11", "metrics", payload).passed;
}

export function checkTenantPermission(
  state: Phase11CommercialState,
  tenantId: string,
  adminId: string,
  action: SaasAdminAction,
  targetType: SaasTargetType | Phase10TargetType,
  targetId: string
): TenantPermissionCheck {
  const role = accountRole(state, tenantId, adminId);
  const tenant = state.commercial_tenants.find((item) => item.tenant_id === tenantId);
  const session = state.auth_sessions.find((item) => item.admin_id === adminId && item.status === "active");
  const allowed =
    Boolean(tenant) &&
    tenant?.commercial_status === "active" &&
    session?.tenant_id === tenantId &&
    role !== null &&
    roleCanPerform(role, action);
  const reason = !tenant
    ? "Unknown commercial tenant."
    : tenant.commercial_status !== "active"
      ? "Commercial tenant is not active."
      : session?.tenant_id !== tenantId
        ? "Admin session does not belong to this tenant."
        : role === null
          ? "No active admin session for tenant."
          : roleCanPerform(role, action)
            ? "Allowed by tenant-scoped RBAC policy."
            : `Role ${role} cannot perform ${action}.`;

  return TenantPermissionCheckSchema.parse({
    tenant_id: tenantId,
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    allowed,
    reason
  });
}

export function getCommercialApprovedSnapshot(
  state: Phase11CommercialState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot | null {
  if (!commercialTenantReady(state, tenantId, campaignId)) {
    return null;
  }
  if (!state.managed_databases.every((database) => database.restore_drill_passed)) {
    return null;
  }
  if (!state.privacy_scans.every((scan) => scan.passed)) {
    return null;
  }

  return getActivePilotSnapshot(state.phase10_state, tenantId, campaignId);
}

export function buildCommercialExportPackage(
  state: Phase11CommercialState,
  tenantId: string,
  campaignId: string
): CommercialExportPackage {
  const snapshot = getCommercialApprovedSnapshot(state, tenantId, campaignId);

  if (!snapshot) {
    throw new Error(`Missing commercial-approved snapshot for ${tenantId}/${campaignId}`);
  }

  return CommercialExportPackageSchema.parse({
    tenant_id: tenantId,
    campaign_id: campaignId,
    snapshot_id: snapshot.snapshot_id,
    metrics_summary_id: "METRICS-001",
    audit_export_id: "AUDIT-EXPORT-001",
    privacy_scan_id: "PRIVACY-001",
    generated_at: REVIEWED_AT
  });
}

export function buildManagedPostgresSchemaPreview(): string {
  return [
    "create table commercial_tenants (tenant_id text primary key, client_name text not null, commercial_status text not null, service_tier text not null, enabled_campaign_ids jsonb not null, allowed_campaign_count integer not null, support_owner text not null, privacy_owner text not null, data_region text not null, started_at timestamptz not null, ended_at timestamptz);",
    "create table admin_auth_sessions (session_id text primary key, admin_id text not null, tenant_id text not null, role text not null, issued_at timestamptz not null, expires_at timestamptz not null, mfa_required boolean not null, status text not null);",
    "create table tenant_permission_checks (tenant_id text not null, admin_id text not null, action text not null, target_type text not null, target_id text not null, allowed boolean not null, reason text not null);",
    "create table managed_database_statuses (database_id text primary key, environment text not null, migration_version text not null, backup_status text not null, last_backup_at timestamptz not null, last_restore_drill_at timestamptz not null, restore_drill_passed boolean not null);",
    "create table customer_onboarding_checklists (tenant_id text primary key, items jsonb not null, owner_role text not null, status text not null, evidence text not null, completed_at timestamptz);",
    "create table commercial_export_packages (tenant_id text not null, campaign_id text not null, snapshot_id text not null, metrics_summary_id text not null, audit_export_id text not null, privacy_scan_id text not null, generated_at timestamptz not null);",
    "create table support_incidents (incident_id text primary key, tenant_id text not null, severity text not null, category text not null, status text not null, reported_at timestamptz not null, resolved_at timestamptz, root_cause text not null, follow_up_actions jsonb not null);"
  ].join("\n");
}

export function migratePhase10ToCommercialState(
  seedState = samplePhase10PilotState
): Phase11CommercialState {
  const phase10State = clonePhase10State(seedState);
  const baseState: Phase11CommercialState = {
    commercial_tenants: PHASE11_COMMERCIAL_TENANTS,
    auth_sessions: PHASE11_AUTH_SESSIONS,
    permission_checks: [],
    managed_databases: PHASE11_MANAGED_DATABASES,
    onboarding_checklists: PHASE11_ONBOARDING_CHECKLISTS,
    export_packages: [],
    support_incidents: PHASE11_SUPPORT_INCIDENTS,
    privacy_scans: [
      scanPhase10Privacy("PRIVACY-001", "tenant", PHASE11_COMMERCIAL_TENANTS),
      scanPhase10Privacy("PRIVACY-002", "admin_account", PHASE11_AUTH_SESSIONS),
      scanPhase10Privacy("PRIVACY-003", "published_snapshot", phase10State.phase9_state.published_snapshots),
      scanPhase10Privacy("PRIVACY-004", "metrics", phase10State.metrics_summaries),
      scanPhase10Privacy("PRIVACY-005", "pilot_report", PHASE11_SUPPORT_INCIDENTS)
    ],
    phase10_state: phase10State
  };
  const permissionChecks = [
    checkTenantPermission(baseState, INTERNAL_TENANT_ID, "ADM-004", "config:save_draft", "config_version", "CFG-101"),
    checkTenantPermission(baseState, INTERNAL_TENANT_ID, "ADM-001", "blocklist:block", "card_blocklist", "CARD-KB-001"),
    checkTenantPermission(baseState, INTERNAL_TENANT_ID, "ADM-001", "config:publish", "published_snapshot", "SNP-001"),
    checkTenantPermission(baseState, INTERNAL_TENANT_ID, "ADM-005", "config:rollback", "published_snapshot", "SNP-001"),
    checkTenantPermission(baseState, INTERNAL_TENANT_ID, "ADM-006", "metrics:read", "metrics", "CMP-001")
  ];
  const withChecks = {
    ...baseState,
    permission_checks: permissionChecks
  };

  return {
    ...withChecks,
    export_packages: [buildCommercialExportPackage(withChecks, INTERNAL_TENANT_ID, "CMP-001")]
  };
}

export function buildPhase11CommercialReport(state: Phase11CommercialState): Phase11CommercialReport {
  const phase10Report = buildPhase10PilotReport(state.phase10_state);
  const migrationCheckPassed =
    phase10Report.go_no_go_decision === "go" &&
    state.commercial_tenants.length >= state.phase10_state.pilot_tenants.length &&
    state.phase10_state.pilot_releases.length >= 2;
  const backupRestorePassed = state.managed_databases.every(
    (database) => database.backup_status === "completed" && database.restore_drill_passed
  );
  const privacyCheckPassed = state.privacy_scans.every((scan) => scan.passed) && assertPhase11PrivacyBoundary(state);
  const rbacCheckPassed =
    !checkTenantPermission(state, INTERNAL_TENANT_ID, "ADM-004", "config:save_draft", "config_version", "CFG-101").allowed &&
    checkTenantPermission(state, INTERNAL_TENANT_ID, "ADM-001", "blocklist:block", "card_blocklist", "CARD-KB-001").allowed &&
    !checkTenantPermission(state, INTERNAL_TENANT_ID, "ADM-001", "config:publish", "published_snapshot", "SNP-001").allowed &&
    checkTenantPermission(state, INTERNAL_TENANT_ID, "ADM-005", "config:rollback", "published_snapshot", "SNP-001").allowed &&
    !checkTenantPermission(state, INTERNAL_TENANT_ID, "ADM-006", "metrics:read", "metrics", "CMP-001").allowed;
  const readinessPassed = state.onboarding_checklists.every(
    (checklist) => checklist.status === "complete" && checklist.completed_at !== null
  );
  const activeCustomerCount = state.commercial_tenants.filter(
    (tenant) => tenant.commercial_status === "active" && !tenant.client_name.toLowerCase().startsWith("internal")
  ).length;
  const ready =
    migrationCheckPassed &&
    rbacCheckPassed &&
    backupRestorePassed &&
    privacyCheckPassed &&
    readinessPassed &&
    activeCustomerCount >= 1;

  return Phase11CommercialReportSchema.parse({
    tenant_count: state.commercial_tenants.length,
    active_customer_count: activeCustomerCount,
    migration_check_passed: migrationCheckPassed,
    rbac_check_passed: rbacCheckPassed,
    backup_restore_passed: backupRestorePassed,
    privacy_check_passed: privacyCheckPassed,
    customer_readiness_summary:
      "Commercial hardening is ready for manually approved B-side customers with RBAC, backup restore, privacy scans, audit export, and no public signup or hardware integration.",
    go_no_go_decision: ready ? "go" : "hold"
  });
}

export const samplePhase11CommercialState = migratePhase10ToCommercialState();
export const samplePhase11CommercialReport = buildPhase11CommercialReport(samplePhase11CommercialState);
export const samplePhase11ManagedPostgresSchema = buildManagedPostgresSchemaPreview();
