import {
  CustomerHealthTrendSchema,
  CustomerOnboardingRunSchema,
  CustomerReportPackageSchema,
  CustomerScaleBatchSchema,
  Phase13ScaleReportSchema,
  ScaleReadinessGateSchema,
  SlaPerformanceSummarySchema,
  type CustomerHealthTrend,
  type CustomerOnboardingRun,
  type CustomerReportPackage,
  type CustomerScaleBatch,
  type Phase13ScaleReport,
  type ScaleReadinessGate,
  type SlaPerformanceSummary
} from "./phase13-contracts";
import {
  CustomerSlaPolicySchema,
  TenantEntitlementSchema,
  type CustomerResourceType,
  type CustomerSlaPolicy,
  type TenantEntitlement
} from "./phase12-contracts";
import {
  assertPhase12PrivacyBoundary,
  buildPhase12ExpansionReport,
  getExpansionApprovedSnapshot,
  samplePhase12ExpansionState,
  type Phase12ExpansionState
} from "./phase12-expansion";
import { scanPhase10Privacy } from "./phase10-pilot";
import { phase9DefaultTenantId } from "./phase9-saas";
import type { PublishedConfigSnapshot } from "./phase9-contracts";

const REVIEWED_AT = "2026-05-01T00:00:00.000Z";
const INTERNAL_TENANT_ID = phase9DefaultTenantId;
const SCALE_CUSTOMER_IDS = ["TEN-002", "TEN-003", "TEN-004", "TEN-005", "TEN-006", "TEN-007"] as const;
const THEME_ALIASES: Record<string, string> = {
  "THEME-QIANCHENG": "THEME-QIANCHENG-001",
  "THEME-SHANHE": "THEME-SHANHE-001"
};

export type Phase13ScaleState = {
  scale_batches: CustomerScaleBatch[];
  tenant_entitlements: TenantEntitlement[];
  sla_policies: CustomerSlaPolicy[];
  onboarding_runs: CustomerOnboardingRun[];
  health_trends: CustomerHealthTrend[];
  sla_performance_summaries: SlaPerformanceSummary[];
  report_packages: CustomerReportPackage[];
  readiness_gates: ScaleReadinessGate[];
  privacy_scans: ReturnType<typeof scanPhase10Privacy>[];
  phase12_state: Phase12ExpansionState;
};

export const PHASE13_SCALE_BATCHES: CustomerScaleBatch[] = CustomerScaleBatchSchema.array().parse([
  {
    batch_id: "SCALE-001",
    started_at: REVIEWED_AT,
    ended_at: null,
    target_customer_count: 3,
    tenant_ids: ["TEN-002", "TEN-003", "TEN-004"],
    owner_role: "operations",
    success_metrics: {
      min_active_customer_count: 3,
      min_completion_rate: 0.7,
      min_sla_response_met_rate: 0.9,
      max_negative_feedback_count: 0,
      privacy_complaint_target: 0
    },
    status: "active"
  },
  {
    batch_id: "SCALE-002",
    started_at: REVIEWED_AT,
    ended_at: null,
    target_customer_count: 3,
    tenant_ids: ["TEN-005", "TEN-006", "TEN-007"],
    owner_role: "operations",
    success_metrics: {
      min_active_customer_count: 3,
      min_completion_rate: 0.7,
      min_sla_response_met_rate: 0.9,
      max_negative_feedback_count: 0,
      privacy_complaint_target: 0
    },
    status: "active"
  }
]);

export const PHASE13_TENANT_ENTITLEMENTS: TenantEntitlement[] =
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
    },
    {
      tenant_id: "TEN-005",
      service_tier: "starter",
      allowed_campaign_count: 1,
      allowed_theme_ids: ["THEME-SHANHE-001"],
      export_enabled: true,
      sla_policy_id: "SLA-001",
      status: "active"
    },
    {
      tenant_id: "TEN-006",
      service_tier: "professional",
      allowed_campaign_count: 2,
      allowed_theme_ids: ["THEME-QIANCHENG-001", "THEME-SHANHE-001"],
      export_enabled: true,
      sla_policy_id: "SLA-002",
      status: "active"
    },
    {
      tenant_id: "TEN-007",
      service_tier: "enterprise_trial",
      allowed_campaign_count: 3,
      allowed_theme_ids: ["THEME-QIANCHENG-001", "THEME-SHANHE-001"],
      export_enabled: true,
      sla_policy_id: "SLA-003",
      status: "active"
    }
  ]);

export const PHASE13_SLA_POLICIES: CustomerSlaPolicy[] = CustomerSlaPolicySchema.array().parse([
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

export const PHASE13_ONBOARDING_RUNS: CustomerOnboardingRun[] =
  CustomerOnboardingRunSchema.array().parse(
    SCALE_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      batch_id: index < 3 ? "SCALE-001" : "SCALE-002",
      checklist_status: "complete",
      theme_authorized: true,
      privacy_review_passed: true,
      legal_review_passed: true,
      first_campaign_ready: true,
      completed_at: REVIEWED_AT
    }))
  );

export const PHASE13_HEALTH_TRENDS: CustomerHealthTrend[] = CustomerHealthTrendSchema.array().parse([
  {
    tenant_id: "TEN-002",
    week: "2026-W19",
    score: 88,
    status: "healthy",
    risk_flags: [],
    sla_miss_count: 0,
    support_incident_count: 1,
    recommended_actions: ["Keep weekly customer report review."]
  },
  {
    tenant_id: "TEN-003",
    week: "2026-W19",
    score: 82,
    status: "healthy",
    risk_flags: ["first_week_onboarding_watch"],
    sla_miss_count: 0,
    support_incident_count: 0,
    recommended_actions: ["Confirm first campaign report with customer operator."]
  },
  {
    tenant_id: "TEN-004",
    week: "2026-W19",
    score: 85,
    status: "healthy",
    risk_flags: [],
    sla_miss_count: 0,
    support_incident_count: 0,
    recommended_actions: ["Keep entitlement limits unchanged."]
  },
  {
    tenant_id: "TEN-005",
    week: "2026-W19",
    score: 80,
    status: "healthy",
    risk_flags: ["new_batch_watch"],
    sla_miss_count: 0,
    support_incident_count: 0,
    recommended_actions: ["Review onboarding evidence after first live run."]
  },
  {
    tenant_id: "TEN-006",
    week: "2026-W19",
    score: 84,
    status: "healthy",
    risk_flags: [],
    sla_miss_count: 0,
    support_incident_count: 0,
    recommended_actions: ["Prepare second campaign entitlement review."]
  },
  {
    tenant_id: "TEN-007",
    week: "2026-W19",
    score: 86,
    status: "healthy",
    risk_flags: [],
    sla_miss_count: 0,
    support_incident_count: 1,
    recommended_actions: ["Keep engineering rollback owner assigned."]
  }
]);

export const PHASE13_SLA_PERFORMANCE_SUMMARIES: SlaPerformanceSummary[] =
  SlaPerformanceSummarySchema.array().parse(
    PHASE13_TENANT_ENTITLEMENTS.filter((entitlement) => entitlement.tenant_id !== INTERNAL_TENANT_ID).map(
      (entitlement, index) => ({
        tenant_id: entitlement.tenant_id,
        sla_policy_id: entitlement.sla_policy_id,
        response_met_rate: index === 1 ? 0.92 : 0.96,
        escalation_count: index === 5 ? 1 : 0,
        open_incident_count: 0,
        review_completion_rate: 1,
        generated_at: REVIEWED_AT
      })
    )
  );

export const PHASE13_REPORT_PACKAGES: CustomerReportPackage[] =
  CustomerReportPackageSchema.array().parse(
    SCALE_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      report_id: `RPT-${String(index + 1).padStart(3, "0")}`,
      metrics_summary_id: `METRICS-${String(index + 1).padStart(3, "0")}`,
      privacy_scan_id: `PRIVACY-${String(index + 1).padStart(3, "0")}`,
      audit_summary_id: `AUDIT-SUMMARY-${String(index + 1).padStart(3, "0")}`,
      support_summary_id: `SUPPORT-SUMMARY-${String(index + 1).padStart(3, "0")}`,
      generated_at: REVIEWED_AT
    }))
  );

export const PHASE13_READINESS_GATES: ScaleReadinessGate[] = ScaleReadinessGateSchema.array().parse([
  {
    gate_id: "SCALE-GATE-001",
    item: "Customer count remains within 6-10 manually admitted tenants.",
    owner_role: "operations",
    status: "pass",
    evidence: "Two active scale batches cover six customer tenants.",
    blocker_reason: null,
    reviewed_at: REVIEWED_AT
  },
  {
    gate_id: "SCALE-GATE-002",
    item: "Privacy scan and report package are clean for every active tenant.",
    owner_role: "compliance",
    status: "pass",
    evidence: "All report packages, health trends, SLA summaries, and readiness gates pass privacy scan.",
    blocker_reason: null,
    reviewed_at: REVIEWED_AT
  },
  {
    gate_id: "SCALE-GATE-003",
    item: "Support load is acceptable without a formal ticketing system.",
    owner_role: "operations",
    status: "pass",
    evidence: "No open incidents and response-met rate stays above the scale threshold.",
    blocker_reason: null,
    reviewed_at: REVIEWED_AT
  }
]);

function clonePhase12State(state: Phase12ExpansionState): Phase12ExpansionState {
  return JSON.parse(JSON.stringify(state)) as Phase12ExpansionState;
}

function normalizeThemeId(themeId: string): string {
  return THEME_ALIASES[themeId] ?? themeId;
}

function entitlementByTenant(state: Phase13ScaleState, tenantId: string): TenantEntitlement | null {
  return state.tenant_entitlements.find((entitlement) => entitlement.tenant_id === tenantId) ?? null;
}

function activeCustomerEntitlements(state: Phase13ScaleState): TenantEntitlement[] {
  return state.tenant_entitlements.filter(
    (entitlement) => entitlement.tenant_id !== INTERNAL_TENANT_ID && entitlement.status === "active"
  );
}

export function assertPhase13PrivacyBoundary(payload: unknown): boolean {
  return assertPhase12PrivacyBoundary(payload) && scanPhase10Privacy("PRIVACY-PHASE13", "metrics", payload).passed;
}

export function canAccessScaleTenantResource(
  state: Phase13ScaleState,
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

export function canEnableScaleThemeForTenant(
  state: Phase13ScaleState,
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

export function canCreateScaleCampaignForTenant(
  state: Phase13ScaleState,
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

export function canExportScaleReportForTenant(
  state: Phase13ScaleState,
  actorTenantId: string,
  targetTenantId: string
): boolean {
  const entitlement = entitlementByTenant(state, actorTenantId);

  return Boolean(
    entitlement &&
      entitlement.export_enabled &&
      canAccessScaleTenantResource(state, actorTenantId, targetTenantId, "customer_report") &&
      state.report_packages.some((reportPackage) => reportPackage.tenant_id === targetTenantId)
  );
}

export function buildCustomerReportPackage(
  state: Phase13ScaleState,
  tenantId: string
): CustomerReportPackage {
  const existing = state.report_packages.find((reportPackage) => reportPackage.tenant_id === tenantId);

  if (existing) {
    return CustomerReportPackageSchema.parse(existing);
  }

  const index = state.report_packages.length + 1;

  return CustomerReportPackageSchema.parse({
    tenant_id: tenantId,
    report_id: `RPT-${String(index).padStart(3, "0")}`,
    metrics_summary_id: `METRICS-${String(index).padStart(3, "0")}`,
    privacy_scan_id: `PRIVACY-${String(index).padStart(3, "0")}`,
    audit_summary_id: `AUDIT-SUMMARY-${String(index).padStart(3, "0")}`,
    support_summary_id: `SUPPORT-SUMMARY-${String(index).padStart(3, "0")}`,
    generated_at: REVIEWED_AT
  });
}

export function getScaleApprovedSnapshot(
  state: Phase13ScaleState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot | null {
  const entitlement = entitlementByTenant(state, tenantId);

  if (!entitlement || entitlement.status !== "active") {
    return null;
  }

  return getExpansionApprovedSnapshot(state.phase12_state, tenantId, campaignId);
}

export function buildScalePostgresSchemaPreview(): string {
  return [
    "create table customer_scale_batches (batch_id text primary key, started_at timestamptz not null, ended_at timestamptz, target_customer_count integer not null, tenant_ids jsonb not null, owner_role text not null, success_metrics jsonb not null, status text not null);",
    "create table customer_onboarding_runs (tenant_id text not null, batch_id text not null, checklist_status text not null, theme_authorized boolean not null, privacy_review_passed boolean not null, legal_review_passed boolean not null, first_campaign_ready boolean not null, completed_at timestamptz);",
    "create table customer_health_trends (tenant_id text not null, week text not null, score integer not null, status text not null, risk_flags jsonb not null, sla_miss_count integer not null, support_incident_count integer not null, recommended_actions jsonb not null);",
    "create table sla_performance_summaries (tenant_id text not null, sla_policy_id text not null, response_met_rate numeric not null, escalation_count integer not null, open_incident_count integer not null, review_completion_rate numeric not null, generated_at timestamptz not null);",
    "create table customer_report_packages (tenant_id text not null, report_id text not null, metrics_summary_id text not null, privacy_scan_id text not null, audit_summary_id text not null, support_summary_id text not null, generated_at timestamptz not null);",
    "create table scale_readiness_gates (gate_id text primary key, item text not null, owner_role text not null, status text not null, evidence text not null, blocker_reason text, reviewed_at timestamptz not null);"
  ].join("\n");
}

export function migratePhase12ToScaleState(
  seedState = samplePhase12ExpansionState
): Phase13ScaleState {
  const phase12State = clonePhase12State(seedState);
  const privacyScans = [
    scanPhase10Privacy("PRIVACY-SCALE-001", "tenant", PHASE13_SCALE_BATCHES),
    scanPhase10Privacy("PRIVACY-SCALE-002", "tenant", PHASE13_TENANT_ENTITLEMENTS),
    scanPhase10Privacy("PRIVACY-SCALE-003", "metrics", PHASE13_HEALTH_TRENDS),
    scanPhase10Privacy("PRIVACY-SCALE-004", "metrics", PHASE13_SLA_PERFORMANCE_SUMMARIES),
    scanPhase10Privacy("PRIVACY-SCALE-005", "pilot_report", PHASE13_REPORT_PACKAGES),
    scanPhase10Privacy("PRIVACY-SCALE-006", "pilot_report", PHASE13_READINESS_GATES)
  ];

  return {
    scale_batches: PHASE13_SCALE_BATCHES,
    tenant_entitlements: PHASE13_TENANT_ENTITLEMENTS,
    sla_policies: PHASE13_SLA_POLICIES,
    onboarding_runs: PHASE13_ONBOARDING_RUNS,
    health_trends: PHASE13_HEALTH_TRENDS,
    sla_performance_summaries: PHASE13_SLA_PERFORMANCE_SUMMARIES,
    report_packages: PHASE13_REPORT_PACKAGES,
    readiness_gates: PHASE13_READINESS_GATES,
    privacy_scans: privacyScans,
    phase12_state: phase12State
  };
}

export function buildPhase13ScaleReport(state: Phase13ScaleState): Phase13ScaleReport {
  const phase12Report = buildPhase12ExpansionReport(state.phase12_state);
  const customerEntitlements = state.tenant_entitlements.filter(
    (entitlement) => entitlement.tenant_id !== INTERNAL_TENANT_ID
  );
  const activeCustomers = activeCustomerEntitlements(state);
  const batchCount = state.scale_batches.length;
  const scaleBatchReady =
    batchCount >= 2 &&
    activeCustomers.length >= 6 &&
    activeCustomers.length <= 10 &&
    state.scale_batches.every(
      (batch) => batch.status === "active" && batch.tenant_ids.length === batch.target_customer_count
    );
  const onboardingCheckPassed = activeCustomers.every((entitlement) =>
    state.onboarding_runs.some(
      (run) =>
        run.tenant_id === entitlement.tenant_id &&
        run.checklist_status === "complete" &&
        run.theme_authorized &&
        run.privacy_review_passed &&
        run.legal_review_passed &&
        run.first_campaign_ready &&
        run.completed_at !== null
    )
  );
  const slaCheckPassed =
    state.sla_policies.every((policy) => policy.review_status === "approved") &&
    state.sla_performance_summaries.every(
      (summary) =>
        summary.response_met_rate >= 0.9 &&
        summary.open_incident_count === 0 &&
        summary.review_completion_rate >= 0.95
    );
  const tenantIsolationPassed = customerEntitlements.every((entitlement) =>
    customerEntitlements.every((other) =>
      entitlement.tenant_id === other.tenant_id
        ? canAccessScaleTenantResource(state, entitlement.tenant_id, other.tenant_id, "customer_report")
        : !canAccessScaleTenantResource(state, entitlement.tenant_id, other.tenant_id, "customer_report")
    )
  );
  const privacyCheckPassed =
    state.privacy_scans.every((scan) => scan.passed) &&
    state.report_packages.every((reportPackage) => assertPhase13PrivacyBoundary(reportPackage)) &&
    assertPhase13PrivacyBoundary(state);
  const supportLoadAcceptable =
    state.sla_performance_summaries.reduce((sum, summary) => sum + summary.open_incident_count, 0) === 0 &&
    state.health_trends.every((trend) => trend.status !== "blocked" && trend.score >= 75);
  const gatesPassed = state.readiness_gates.every((gate) => gate.status === "pass" && gate.blocker_reason === null);
  const ready =
    phase12Report.go_no_go_decision === "go" &&
    scaleBatchReady &&
    onboardingCheckPassed &&
    slaCheckPassed &&
    tenantIsolationPassed &&
    privacyCheckPassed &&
    supportLoadAcceptable &&
    gatesPassed;

  return Phase13ScaleReportSchema.parse({
    customer_count: customerEntitlements.length,
    active_customer_count: activeCustomers.length,
    batch_count: batchCount,
    onboarding_check_passed: onboardingCheckPassed,
    sla_check_passed: slaCheckPassed,
    tenant_isolation_passed: tenantIsolationPassed,
    privacy_check_passed: privacyCheckPassed,
    support_load_acceptable: supportLoadAcceptable,
    go_no_go_decision: ready ? "go" : "hold"
  });
}

export const samplePhase13ScaleState = migratePhase12ToScaleState();
export const samplePhase13ScaleReport = buildPhase13ScaleReport(samplePhase13ScaleState);
export const samplePhase13ScaleSchema = buildScalePostgresSchemaPreview();
