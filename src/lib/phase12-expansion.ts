import {
  CommercialCustomerReportSchema,
  CustomerExpansionBatchSchema,
  CustomerHealthScoreSchema,
  CustomerSlaPolicySchema,
  CustomerSuccessReviewSchema,
  CustomerSupportRunbookSchema,
  Phase12ExpansionReportSchema,
  TenantEntitlementSchema,
  type CommercialCustomerReport,
  type CustomerExpansionBatch,
  type CustomerHealthScore,
  type CustomerResourceType,
  type CustomerSlaPolicy,
  type CustomerSuccessReview,
  type CustomerSupportRunbook,
  type Phase12ExpansionReport,
  type TenantEntitlement
} from "./phase12-contracts";
import {
  assertPhase11PrivacyBoundary,
  buildPhase11CommercialReport,
  getCommercialApprovedSnapshot,
  samplePhase11CommercialState,
  type Phase11CommercialState
} from "./phase11-commercial";
import { scanPhase10Privacy } from "./phase10-pilot";
import { phase9DefaultTenantId } from "./phase9-saas";
import type { PublishedConfigSnapshot } from "./phase9-contracts";

const REVIEWED_AT = "2026-05-01T00:00:00.000Z";
const NEXT_REVIEW_AT = "2026-05-08T00:00:00.000Z";
const INTERNAL_TENANT_ID = phase9DefaultTenantId;
const EXPANSION_CUSTOMER_IDS = ["TEN-002", "TEN-003", "TEN-004"] as const;
const THEME_ALIASES: Record<string, string> = {
  "THEME-QIANCHENG": "THEME-QIANCHENG-001",
  "THEME-SHANHE": "THEME-SHANHE-001"
};

export type Phase12ExpansionState = {
  expansion_batches: CustomerExpansionBatch[];
  tenant_entitlements: TenantEntitlement[];
  sla_policies: CustomerSlaPolicy[];
  customer_health_scores: CustomerHealthScore[];
  customer_reports: CommercialCustomerReport[];
  support_runbooks: CustomerSupportRunbook[];
  success_reviews: CustomerSuccessReview[];
  privacy_scans: ReturnType<typeof scanPhase10Privacy>[];
  phase11_state: Phase11CommercialState;
};

export const PHASE12_EXPANSION_BATCHES: CustomerExpansionBatch[] =
  CustomerExpansionBatchSchema.array().parse([
    {
      batch_id: "EXP-001",
      started_at: REVIEWED_AT,
      ended_at: null,
      target_customer_count: 3,
      eligible_tenant_ids: ["TEN-002", "TEN-003", "TEN-004"],
      success_metrics: {
        min_active_customer_count: 3,
        min_completion_rate: 0.7,
        max_negative_feedback_count: 0,
        privacy_complaint_target: 0
      },
      status: "active"
    }
  ]);

export const PHASE12_TENANT_ENTITLEMENTS: TenantEntitlement[] =
  TenantEntitlementSchema.array().parse([
    {
      tenant_id: INTERNAL_TENANT_ID,
      service_tier: "enterprise_trial",
      allowed_campaign_count: 4,
      allowed_theme_ids: ["THEME-QIANCHENG-001", "THEME-SHANHE-001"],
      export_enabled: true,
      sla_policy_id: "SLA-003",
      status: "active"
    },
    {
      tenant_id: "TEN-002",
      service_tier: "professional",
      allowed_campaign_count: 2,
      allowed_theme_ids: ["THEME-QIANCHENG-001", "THEME-SHANHE-001"],
      export_enabled: true,
      sla_policy_id: "SLA-002",
      status: "active"
    },
    {
      tenant_id: "TEN-003",
      service_tier: "starter",
      allowed_campaign_count: 1,
      allowed_theme_ids: ["THEME-SHANHE-001"],
      export_enabled: true,
      sla_policy_id: "SLA-001",
      status: "active"
    },
    {
      tenant_id: "TEN-004",
      service_tier: "professional",
      allowed_campaign_count: 2,
      allowed_theme_ids: ["THEME-QIANCHENG-001"],
      export_enabled: true,
      sla_policy_id: "SLA-002",
      status: "active"
    }
  ]);

export const PHASE12_SLA_POLICIES: CustomerSlaPolicy[] = CustomerSlaPolicySchema.array().parse([
  {
    sla_policy_id: "SLA-001",
    tier: "starter",
    response_target_hours: 24,
    incident_escalation_hours: 48,
    support_channel: "email",
    review_status: "approved"
  },
  {
    sla_policy_id: "SLA-002",
    tier: "professional",
    response_target_hours: 12,
    incident_escalation_hours: 24,
    support_channel: "shared_chat",
    review_status: "approved"
  },
  {
    sla_policy_id: "SLA-003",
    tier: "enterprise_trial",
    response_target_hours: 8,
    incident_escalation_hours: 12,
    support_channel: "phone_bridge",
    review_status: "approved"
  }
]);

export const PHASE12_CUSTOMER_HEALTH_SCORES: CustomerHealthScore[] =
  CustomerHealthScoreSchema.array().parse([
    {
      tenant_id: "TEN-002",
      score: 88,
      status: "healthy",
      risk_flags: [],
      last_activity_at: REVIEWED_AT,
      last_reviewed_at: REVIEWED_AT
    },
    {
      tenant_id: "TEN-003",
      score: 82,
      status: "healthy",
      risk_flags: ["first_week_onboarding_watch"],
      last_activity_at: REVIEWED_AT,
      last_reviewed_at: REVIEWED_AT
    },
    {
      tenant_id: "TEN-004",
      score: 85,
      status: "healthy",
      risk_flags: [],
      last_activity_at: REVIEWED_AT,
      last_reviewed_at: REVIEWED_AT
    }
  ]);

export const PHASE12_CUSTOMER_REPORTS: CommercialCustomerReport[] =
  CommercialCustomerReportSchema.array().parse([
    {
      tenant_id: "TEN-002",
      campaign_count: 1,
      published_snapshot_count: 1,
      completion_rate: 0.82,
      manual_completion_rate: 0.34,
      negative_feedback_count: 0,
      support_incident_count: 1,
      privacy_check_passed: true,
      generated_at: REVIEWED_AT
    },
    {
      tenant_id: "TEN-003",
      campaign_count: 1,
      published_snapshot_count: 1,
      completion_rate: 0.76,
      manual_completion_rate: 0.42,
      negative_feedback_count: 0,
      support_incident_count: 0,
      privacy_check_passed: true,
      generated_at: REVIEWED_AT
    },
    {
      tenant_id: "TEN-004",
      campaign_count: 1,
      published_snapshot_count: 1,
      completion_rate: 0.79,
      manual_completion_rate: 0.38,
      negative_feedback_count: 0,
      support_incident_count: 0,
      privacy_check_passed: true,
      generated_at: REVIEWED_AT
    }
  ]);

export const PHASE12_SUPPORT_RUNBOOKS: CustomerSupportRunbook[] =
  CustomerSupportRunbookSchema.array().parse([
    {
      runbook_id: "RUN-001",
      scenario: "privacy complaint or raw-face-data concern",
      severity: "sev1",
      owner_role: "compliance",
      steps: [
        "Pause affected campaign if the report mentions raw face data or identity collection.",
        "Run privacy scan on snapshot, metrics, export package, audit summary, and customer report.",
        "Confirm H5 still uses端侧摄像头处理 and does not upload original face data."
      ],
      rollback_required: true,
      review_status: "approved"
    },
    {
      runbook_id: "RUN-002",
      scenario: "release snapshot regression",
      severity: "sev2",
      owner_role: "engineering",
      steps: [
        "Confirm the tenant, campaign, and snapshot status.",
        "Rollback to the previous commercial-approved published snapshot.",
        "Write audit evidence and send customer status note."
      ],
      rollback_required: true,
      review_status: "approved"
    },
    {
      runbook_id: "RUN-003",
      scenario: "customer onboarding or report confusion",
      severity: "sev3",
      owner_role: "operations",
      steps: [
        "Confirm entitlement, allowed themes, campaign count, and export status.",
        "Regenerate customer report and privacy scan.",
        "Schedule next customer success review."
      ],
      rollback_required: false,
      review_status: "approved"
    }
  ]);

export const PHASE12_SUCCESS_REVIEWS: CustomerSuccessReview[] =
  CustomerSuccessReviewSchema.array().parse(
    PHASE12_CUSTOMER_HEALTH_SCORES.map((health) => ({
      tenant_id: health.tenant_id,
      review_period: "2026-W18",
      health_score: health.score,
      blocking_issues: [],
      recommended_actions: [
        "Keep manual admission and weekly report review.",
        "Re-run privacy scan before adding any new campaign."
      ],
      next_review_at: NEXT_REVIEW_AT
    }))
  );

function clonePhase11State(state: Phase11CommercialState): Phase11CommercialState {
  return JSON.parse(JSON.stringify(state)) as Phase11CommercialState;
}

function normalizeThemeId(themeId: string): string {
  return THEME_ALIASES[themeId] ?? themeId;
}

function activeCustomerEntitlements(state: Phase12ExpansionState): TenantEntitlement[] {
  return state.tenant_entitlements.filter(
    (entitlement) => entitlement.tenant_id !== INTERNAL_TENANT_ID && entitlement.status === "active"
  );
}

function entitlementByTenant(state: Phase12ExpansionState, tenantId: string): TenantEntitlement | null {
  return state.tenant_entitlements.find((entitlement) => entitlement.tenant_id === tenantId) ?? null;
}

export function assertPhase12PrivacyBoundary(payload: unknown): boolean {
  return assertPhase11PrivacyBoundary(payload) && scanPhase10Privacy("PRIVACY-PHASE12", "metrics", payload).passed;
}

export function canAccessTenantResource(
  state: Phase12ExpansionState,
  actorTenantId: string,
  targetTenantId: string,
  _resourceType: CustomerResourceType
): boolean {
  const actorEntitlement = entitlementByTenant(state, actorTenantId);
  const targetEntitlement = entitlementByTenant(state, targetTenantId);

  return Boolean(
    actorEntitlement &&
      targetEntitlement &&
      actorEntitlement.status === "active" &&
      targetEntitlement.status === "active" &&
      actorTenantId === targetTenantId
  );
}

export function canEnableThemeForTenant(
  state: Phase12ExpansionState,
  tenantId: string,
  themeId: string
): boolean {
  const entitlement = entitlementByTenant(state, tenantId);

  return Boolean(
    entitlement &&
      entitlement.status === "active" &&
      entitlement.allowed_theme_ids.includes(normalizeThemeId(themeId))
  );
}

export function canCreateCampaignForTenant(
  state: Phase12ExpansionState,
  tenantId: string,
  nextCampaignCount: number
): boolean {
  const entitlement = entitlementByTenant(state, tenantId);

  return Boolean(
    entitlement &&
      entitlement.status === "active" &&
      nextCampaignCount <= entitlement.allowed_campaign_count
  );
}

export function buildCommercialCustomerReport(
  state: Phase12ExpansionState,
  tenantId: string
): CommercialCustomerReport {
  const existing = state.customer_reports.find((report) => report.tenant_id === tenantId);

  if (existing) {
    return CommercialCustomerReportSchema.parse(existing);
  }

  const entitlement = entitlementByTenant(state, tenantId);

  return CommercialCustomerReportSchema.parse({
    tenant_id: tenantId,
    campaign_count: entitlement ? Math.min(1, entitlement.allowed_campaign_count) : 0,
    published_snapshot_count: 0,
    completion_rate: 0,
    manual_completion_rate: 0,
    negative_feedback_count: 0,
    support_incident_count: state.phase11_state.support_incidents.filter((incident) => incident.tenant_id === tenantId)
      .length,
    privacy_check_passed: assertPhase12PrivacyBoundary({ tenant_id: tenantId }),
    generated_at: REVIEWED_AT
  });
}

export function getExpansionApprovedSnapshot(
  state: Phase12ExpansionState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot | null {
  const entitlement = entitlementByTenant(state, tenantId);

  if (!entitlement || entitlement.status !== "active") {
    return null;
  }

  return getCommercialApprovedSnapshot(state.phase11_state, tenantId, campaignId);
}

export function buildExpansionPostgresSchemaPreview(): string {
  return [
    "create table customer_expansion_batches (batch_id text primary key, started_at timestamptz not null, ended_at timestamptz, target_customer_count integer not null, eligible_tenant_ids jsonb not null, success_metrics jsonb not null, status text not null);",
    "create table tenant_entitlements (tenant_id text primary key, service_tier text not null, allowed_campaign_count integer not null, allowed_theme_ids jsonb not null, export_enabled boolean not null, sla_policy_id text not null, status text not null);",
    "create table customer_sla_policies (sla_policy_id text primary key, tier text not null, response_target_hours integer not null, incident_escalation_hours integer not null, support_channel text not null, review_status text not null);",
    "create table customer_health_scores (tenant_id text primary key, score integer not null, status text not null, risk_flags jsonb not null, last_activity_at timestamptz not null, last_reviewed_at timestamptz not null);",
    "create table commercial_customer_reports (tenant_id text not null, campaign_count integer not null, published_snapshot_count integer not null, completion_rate numeric not null, manual_completion_rate numeric not null, negative_feedback_count integer not null, support_incident_count integer not null, privacy_check_passed boolean not null, generated_at timestamptz not null);",
    "create table customer_support_runbooks (runbook_id text primary key, scenario text not null, severity text not null, owner_role text not null, steps jsonb not null, rollback_required boolean not null, review_status text not null);",
    "create table customer_success_reviews (tenant_id text not null, review_period text not null, health_score integer not null, blocking_issues jsonb not null, recommended_actions jsonb not null, next_review_at timestamptz not null);"
  ].join("\n");
}

export function migratePhase11ToExpansionState(
  seedState = samplePhase11CommercialState
): Phase12ExpansionState {
  const phase11State = clonePhase11State(seedState);
  const privacyScans = [
    scanPhase10Privacy("PRIVACY-EXP-001", "tenant", PHASE12_EXPANSION_BATCHES),
    scanPhase10Privacy("PRIVACY-EXP-002", "tenant", PHASE12_TENANT_ENTITLEMENTS),
    scanPhase10Privacy("PRIVACY-EXP-003", "metrics", PHASE12_CUSTOMER_REPORTS),
    scanPhase10Privacy("PRIVACY-EXP-004", "pilot_report", PHASE12_SUPPORT_RUNBOOKS),
    scanPhase10Privacy("PRIVACY-EXP-005", "pilot_report", PHASE12_SUCCESS_REVIEWS)
  ];

  return {
    expansion_batches: PHASE12_EXPANSION_BATCHES,
    tenant_entitlements: PHASE12_TENANT_ENTITLEMENTS,
    sla_policies: PHASE12_SLA_POLICIES,
    customer_health_scores: PHASE12_CUSTOMER_HEALTH_SCORES,
    customer_reports: PHASE12_CUSTOMER_REPORTS,
    support_runbooks: PHASE12_SUPPORT_RUNBOOKS,
    success_reviews: PHASE12_SUCCESS_REVIEWS,
    privacy_scans: privacyScans,
    phase11_state: phase11State
  };
}

export function buildPhase12ExpansionReport(state: Phase12ExpansionState): Phase12ExpansionReport {
  const phase11Report = buildPhase11CommercialReport(state.phase11_state);
  const customerEntitlements = state.tenant_entitlements.filter(
    (entitlement) => entitlement.tenant_id !== INTERNAL_TENANT_ID
  );
  const activeCustomerCount = activeCustomerEntitlements(state).length;
  const batchReady = state.expansion_batches.some(
    (batch) =>
      batch.status === "active" &&
      batch.target_customer_count >= 3 &&
      batch.target_customer_count <= 5 &&
      batch.eligible_tenant_ids.length >= 3
  );
  const slaCheckPassed =
    state.sla_policies.every((policy) => policy.review_status === "approved") &&
    state.tenant_entitlements.every((entitlement) =>
      state.sla_policies.some((policy) => policy.sla_policy_id === entitlement.sla_policy_id)
    );
  const tenantIsolationPassed = customerEntitlements.every((entitlement) =>
    customerEntitlements.every((other) =>
      entitlement.tenant_id === other.tenant_id
        ? canAccessTenantResource(state, entitlement.tenant_id, other.tenant_id, "customer_report")
        : !canAccessTenantResource(state, entitlement.tenant_id, other.tenant_id, "customer_report")
    )
  );
  const privacyCheckPassed =
    state.privacy_scans.every((scan) => scan.passed) &&
    state.customer_reports.every((report) => report.privacy_check_passed && assertPhase12PrivacyBoundary(report)) &&
    assertPhase12PrivacyBoundary(state);
  const supportReadinessPassed =
    state.support_runbooks.every((runbook) => runbook.review_status === "approved" && runbook.steps.length > 0) &&
    state.success_reviews.every((review) => review.next_review_at.length > 0);
  const healthReady = state.customer_health_scores.every((health) => health.status !== "blocked" && health.score >= 75);
  const ready =
    phase11Report.go_no_go_decision === "go" &&
    batchReady &&
    activeCustomerCount >= 3 &&
    activeCustomerCount <= 5 &&
    slaCheckPassed &&
    tenantIsolationPassed &&
    privacyCheckPassed &&
    supportReadinessPassed &&
    healthReady;

  return Phase12ExpansionReportSchema.parse({
    customer_count: customerEntitlements.length,
    active_customer_count: activeCustomerCount,
    sla_check_passed: slaCheckPassed,
    tenant_isolation_passed: tenantIsolationPassed,
    privacy_check_passed: privacyCheckPassed,
    support_readiness_passed: supportReadinessPassed,
    go_no_go_decision: ready ? "go" : "hold"
  });
}

export const samplePhase12ExpansionState = migratePhase11ToExpansionState();
export const samplePhase12ExpansionReport = buildPhase12ExpansionReport(samplePhase12ExpansionState);
export const samplePhase12ExpansionSchema = buildExpansionPostgresSchemaPreview();
