import {
  BillingEvidenceBacklogSchema,
  CustomerGrowthCohortSchema,
  CustomerGrowthPolicySchema,
  CustomerLifecycleStateSchema,
  CustomerPortfolioReportSchema,
  CustomerRetentionSignalSchema,
  GrowthCapacityForecastSchema,
  Phase15ExpansionReportSchema,
  type BillingEvidenceBacklog,
  type CustomerGrowthCohort,
  type CustomerGrowthPolicy,
  type CustomerLifecycleState,
  type CustomerPortfolioReport,
  type CustomerRetentionSignal,
  type GrowthCapacityForecast,
  type Phase15ExpansionReport
} from "./phase15-contracts";
import { CustomerOperationProfileSchema, type CustomerOperationProfile } from "./phase14-contracts";
import type { CustomerResourceType } from "./phase12-contracts";
import {
  assertPhase14PrivacyBoundary,
  buildPhase14OpsReport,
  getOpsApprovedSnapshot,
  samplePhase14OpsState,
  type Phase14OpsState
} from "./phase14-ops";
import { scanPhase10Privacy } from "./phase10-pilot";
import { phase9DefaultTenantId } from "./phase9-saas";
import type { PublishedConfigSnapshot } from "./phase9-contracts";

const REVIEWED_AT = "2026-05-01T00:00:00.000Z";
const INTERNAL_TENANT_ID = phase9DefaultTenantId;
const GROWTH_CUSTOMER_IDS = [
  "TEN-002",
  "TEN-003",
  "TEN-004",
  "TEN-005",
  "TEN-006",
  "TEN-007",
  "TEN-008",
  "TEN-009",
  "TEN-010",
  "TEN-011",
  "TEN-012",
  "TEN-013",
  "TEN-014",
  "TEN-015",
  "TEN-016",
  "TEN-017"
] as const;
const NEW_GROWTH_CUSTOMER_IDS = ["TEN-012", "TEN-013", "TEN-014", "TEN-015", "TEN-016", "TEN-017"] as const;
const ACTIVE_LIFECYCLE_STATUSES = ["stable", "risk_watch"] as const;
const THEME_ALIASES: Record<string, string> = {
  "THEME-QIANCHENG": "THEME-QIANCHENG-001",
  "THEME-SHANHE": "THEME-SHANHE-001"
};

export type Phase15GrowthState = {
  growth_cohorts: CustomerGrowthCohort[];
  growth_policies: CustomerGrowthPolicy[];
  operation_profiles: CustomerOperationProfile[];
  lifecycle_states: CustomerLifecycleState[];
  capacity_forecasts: GrowthCapacityForecast[];
  retention_signals: CustomerRetentionSignal[];
  billing_evidence_backlog: BillingEvidenceBacklog[];
  privacy_scans: ReturnType<typeof scanPhase10Privacy>[];
  phase14_state: Phase14OpsState;
};

export const PHASE15_GROWTH_POLICIES: CustomerGrowthPolicy[] =
  CustomerGrowthPolicySchema.array().parse([
    {
      policy_id: "GROWTH-POLICY-001",
      max_customer_count: 25,
      required_reviews: ["operations", "compliance", "legal"],
      allowed_service_tiers: ["starter", "professional", "enterprise_trial"],
      support_capacity_thresholds: {
        min_response_met_rate: 0.9,
        min_review_completion_rate: 0.95,
        max_open_incidents: 1,
        max_projected_load: 0.85
      },
      stop_conditions: [
        "Any privacy scan fails.",
        "Support capacity forecast becomes overloaded.",
        "Tenant isolation check fails.",
        "Customer requests public signup, online payment, or hardware before governance is ready."
      ],
      review_status: "approved"
    }
  ]);

export const PHASE15_GROWTH_COHORTS: CustomerGrowthCohort[] =
  CustomerGrowthCohortSchema.array().parse([
    {
      cohort_id: "COHORT-001",
      started_at: REVIEWED_AT,
      ended_at: null,
      target_customer_count: 5,
      tenant_ids: ["TEN-002", "TEN-003", "TEN-004", "TEN-005", "TEN-006"],
      growth_policy_id: "GROWTH-POLICY-001",
      owner_role: "operations",
      status: "active"
    },
    {
      cohort_id: "COHORT-002",
      started_at: REVIEWED_AT,
      ended_at: null,
      target_customer_count: 5,
      tenant_ids: ["TEN-007", "TEN-008", "TEN-009", "TEN-010", "TEN-011"],
      growth_policy_id: "GROWTH-POLICY-001",
      owner_role: "operations",
      status: "active"
    },
    {
      cohort_id: "COHORT-003",
      started_at: REVIEWED_AT,
      ended_at: null,
      target_customer_count: 3,
      tenant_ids: ["TEN-012", "TEN-013", "TEN-014"],
      growth_policy_id: "GROWTH-POLICY-001",
      owner_role: "operations",
      status: "active"
    },
    {
      cohort_id: "COHORT-004",
      started_at: REVIEWED_AT,
      ended_at: null,
      target_customer_count: 3,
      tenant_ids: ["TEN-015", "TEN-016", "TEN-017"],
      growth_policy_id: "GROWTH-POLICY-001",
      owner_role: "operations",
      status: "active"
    }
  ]);

const PHASE15_NEW_OPERATION_PROFILES: CustomerOperationProfile[] =
  CustomerOperationProfileSchema.array().parse(
    NEW_GROWTH_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      service_tier: index === 4 ? "enterprise_trial" : index % 2 === 0 ? "professional" : "starter",
      support_owner: `support-${tenantId.toLowerCase()}@xiangmian.example`,
      privacy_owner: `privacy-${tenantId.toLowerCase()}@xiangmian.example`,
      contract_contact: `contract-${tenantId.toLowerCase()}@xiangmian.example`,
      allowed_campaign_count: 3,
      allowed_theme_ids: ["THEME-QIANCHENG-001", "THEME-SHANHE-001"],
      status: "active"
    }))
  );

export const PHASE15_LIFECYCLE_STATES: CustomerLifecycleState[] =
  CustomerLifecycleStateSchema.array().parse([
    {
      tenant_id: INTERNAL_TENANT_ID,
      lifecycle_status: "stable",
      onboarding_completed_at: REVIEWED_AT,
      first_campaign_published_at: REVIEWED_AT,
      last_active_at: REVIEWED_AT,
      pause_reason: null,
      archive_reason: null
    },
    ...GROWTH_CUSTOMER_IDS.map((tenantId) => ({
      tenant_id: tenantId,
      lifecycle_status: "stable" as const,
      onboarding_completed_at: REVIEWED_AT,
      first_campaign_published_at: REVIEWED_AT,
      last_active_at: REVIEWED_AT,
      pause_reason: null,
      archive_reason: null
    }))
  ]);

export const PHASE15_CAPACITY_FORECASTS: GrowthCapacityForecast[] =
  GrowthCapacityForecastSchema.array().parse([
    {
      period: "2026-W28",
      active_customer_count: 16,
      support_owner_count: 4,
      incident_count: 6,
      open_incident_count: 0,
      response_met_rate: 0.93,
      projected_load: 0.72,
      capacity_status: "healthy"
    }
  ]);

export const PHASE15_RETENTION_SIGNALS: CustomerRetentionSignal[] =
  CustomerRetentionSignalSchema.array().parse(
    GROWTH_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      review_period: "2026-W28",
      health_score: index === 13 ? 72 : 86 + (index % 5),
      renewal_intent: index === 13 ? "neutral" : index % 6 === 0 ? "strong" : "positive",
      risk_level: index === 13 ? "medium" : "low",
      expansion_opportunity: index % 4 === 0,
      next_action: index === 13 ? "Review pricing objection and contract path." : "Continue weekly customer success review."
    }))
  );

export const PHASE15_BILLING_EVIDENCE_BACKLOG: BillingEvidenceBacklog[] =
  BillingEvidenceBacklogSchema.array().parse(
    GROWTH_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      pricing_objection: index === 13 || index === 15,
      contract_blockers: index === 13 ? ["procurement owner not confirmed"] : [],
      requested_terms: index % 5 === 0 ? ["quarterly review package"] : ["manual admission terms"],
      procurement_stage: index === 13 ? "procurement" : "discovery",
      urgency: index === 13 ? "medium" : "low",
      next_action: index === 13 ? "Collect procurement evidence for Phase 16." : "Keep as billing evidence only.",
      review_status: "approved"
    }))
  );

function clonePhase14State(state: Phase14OpsState): Phase14OpsState {
  return JSON.parse(JSON.stringify(state)) as Phase14OpsState;
}

function normalizeThemeId(themeId: string): string {
  return THEME_ALIASES[themeId] ?? themeId;
}

function operationProfileByTenant(state: Phase15GrowthState, tenantId: string): CustomerOperationProfile | null {
  return state.operation_profiles.find((profile) => profile.tenant_id === tenantId) ?? null;
}

function lifecycleByTenant(state: Phase15GrowthState, tenantId: string): CustomerLifecycleState | null {
  return state.lifecycle_states.find((lifecycle) => lifecycle.tenant_id === tenantId) ?? null;
}

function activeCustomerLifecycles(state: Phase15GrowthState): CustomerLifecycleState[] {
  return state.lifecycle_states.filter(
    (lifecycle) =>
      lifecycle.tenant_id !== INTERNAL_TENANT_ID &&
      ACTIVE_LIFECYCLE_STATUSES.includes(lifecycle.lifecycle_status as (typeof ACTIVE_LIFECYCLE_STATUSES)[number])
  );
}

function latestCapacityForecast(state: Phase15GrowthState): GrowthCapacityForecast | null {
  return state.capacity_forecasts.at(-1) ?? null;
}

function growthPolicyById(state: Phase15GrowthState, policyId: string): CustomerGrowthPolicy | null {
  return state.growth_policies.find((policy) => policy.policy_id === policyId) ?? null;
}

function capacityPassesPolicy(forecast: GrowthCapacityForecast | null, policy: CustomerGrowthPolicy | null): boolean {
  if (!forecast || !policy) {
    return false;
  }

  const thresholds = policy.support_capacity_thresholds;

  return (
    forecast.capacity_status !== "overloaded" &&
    forecast.response_met_rate >= thresholds.min_response_met_rate &&
    forecast.open_incident_count <= thresholds.max_open_incidents &&
    forecast.projected_load <= thresholds.max_projected_load
  );
}

export function assertPhase15PrivacyBoundary(payload: unknown): boolean {
  return assertPhase14PrivacyBoundary(payload) && scanPhase10Privacy("PRIVACY-PHASE15", "metrics", payload).passed;
}

export function canAccessGrowthTenantResource(
  state: Phase15GrowthState,
  actorTenantId: string,
  targetTenantId: string,
  _resourceType: CustomerResourceType
): boolean {
  const actorLifecycle = lifecycleByTenant(state, actorTenantId);
  const targetLifecycle = lifecycleByTenant(state, targetTenantId);

  return Boolean(
    actorLifecycle &&
      targetLifecycle &&
      ACTIVE_LIFECYCLE_STATUSES.includes(actorLifecycle.lifecycle_status as (typeof ACTIVE_LIFECYCLE_STATUSES)[number]) &&
      ACTIVE_LIFECYCLE_STATUSES.includes(targetLifecycle.lifecycle_status as (typeof ACTIVE_LIFECYCLE_STATUSES)[number]) &&
      actorTenantId === targetTenantId
  );
}

export function canAdmitCustomerToCohort(
  state: Phase15GrowthState,
  tenantId: string,
  cohortId: string
): boolean {
  const cohort = state.growth_cohorts.find((item) => item.cohort_id === cohortId);
  const lifecycle = lifecycleByTenant(state, tenantId);
  const profile = operationProfileByTenant(state, tenantId);
  const policy = cohort ? growthPolicyById(state, cohort.growth_policy_id) : null;
  const activeCount = activeCustomerLifecycles(state).length;
  const capacityForecast = latestCapacityForecast(state);

  return Boolean(
    cohort &&
      lifecycle &&
      profile &&
      policy &&
      cohort.status === "active" &&
      cohort.tenant_ids.includes(tenantId) &&
      ACTIVE_LIFECYCLE_STATUSES.includes(lifecycle.lifecycle_status as (typeof ACTIVE_LIFECYCLE_STATUSES)[number]) &&
      profile.status === "active" &&
      activeCount <= policy.max_customer_count &&
      policy.review_status === "approved" &&
      policy.allowed_service_tiers.includes(profile.service_tier) &&
      capacityPassesPolicy(capacityForecast, policy)
  );
}

export function canEnableGrowthThemeForTenant(
  state: Phase15GrowthState,
  tenantId: string,
  themeId: string
): boolean {
  const lifecycle = lifecycleByTenant(state, tenantId);
  const profile = operationProfileByTenant(state, tenantId);

  return Boolean(
    lifecycle &&
      profile &&
      ACTIVE_LIFECYCLE_STATUSES.includes(lifecycle.lifecycle_status as (typeof ACTIVE_LIFECYCLE_STATUSES)[number]) &&
      profile.status === "active" &&
      profile.allowed_theme_ids.includes(normalizeThemeId(themeId))
  );
}

export function canCreateGrowthCampaignForTenant(
  state: Phase15GrowthState,
  tenantId: string,
  nextCampaignCount: number
): boolean {
  const lifecycle = lifecycleByTenant(state, tenantId);
  const profile = operationProfileByTenant(state, tenantId);

  return Boolean(
    lifecycle &&
      profile &&
      ACTIVE_LIFECYCLE_STATUSES.includes(lifecycle.lifecycle_status as (typeof ACTIVE_LIFECYCLE_STATUSES)[number]) &&
      profile.status === "active" &&
      nextCampaignCount <= profile.allowed_campaign_count
  );
}

export function getGrowthApprovedSnapshot(
  state: Phase15GrowthState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot | null {
  const lifecycle = lifecycleByTenant(state, tenantId);

  if (!lifecycle || !ACTIVE_LIFECYCLE_STATUSES.includes(lifecycle.lifecycle_status as (typeof ACTIVE_LIFECYCLE_STATUSES)[number])) {
    return null;
  }

  return getOpsApprovedSnapshot(state.phase14_state, tenantId, campaignId);
}

export function buildCustomerPortfolioReport(state: Phase15GrowthState): CustomerPortfolioReport {
  const activeLifecycles = activeCustomerLifecycles(state);
  const onboardedCount = activeLifecycles.filter(
    (lifecycle) => lifecycle.onboarding_completed_at && lifecycle.first_campaign_published_at
  ).length;
  const capacityForecast = latestCapacityForecast(state);
  const policy = state.growth_policies[0] ?? null;
  const supportCapacityPassed = capacityPassesPolicy(capacityForecast, policy);
  const privacyCheckPassed =
    state.privacy_scans.every((scan) => scan.passed) &&
    assertPhase15PrivacyBoundary(state.lifecycle_states) &&
    assertPhase15PrivacyBoundary(state.retention_signals) &&
    assertPhase15PrivacyBoundary(state.billing_evidence_backlog);
  const retentionRiskCount = state.retention_signals.filter((signal) => signal.risk_level !== "low").length;

  return CustomerPortfolioReportSchema.parse({
    customer_count: state.lifecycle_states.filter((lifecycle) => lifecycle.tenant_id !== INTERNAL_TENANT_ID).length,
    active_customer_count: activeLifecycles.length,
    cohort_count: state.growth_cohorts.length,
    onboarding_completion_rate: activeLifecycles.length === 0 ? 0 : onboardedCount / activeLifecycles.length,
    sla_check_passed: supportCapacityPassed,
    privacy_check_passed: privacyCheckPassed,
    support_capacity_passed: supportCapacityPassed,
    retention_risk_count: retentionRiskCount
  });
}

export function buildPhase15GrowthPostgresSchemaPreview(): string {
  return [
    "create table customer_growth_cohorts (cohort_id text primary key, started_at timestamptz not null, ended_at timestamptz, target_customer_count integer not null, tenant_ids jsonb not null, growth_policy_id text not null, owner_role text not null, status text not null);",
    "create table customer_growth_policies (policy_id text primary key, max_customer_count integer not null, required_reviews jsonb not null, allowed_service_tiers jsonb not null, support_capacity_thresholds jsonb not null, stop_conditions jsonb not null, review_status text not null);",
    "create table customer_lifecycle_states (tenant_id text primary key, lifecycle_status text not null, onboarding_completed_at timestamptz, first_campaign_published_at timestamptz, last_active_at timestamptz, pause_reason text, archive_reason text);",
    "create table growth_capacity_forecasts (period text primary key, active_customer_count integer not null, support_owner_count integer not null, incident_count integer not null, open_incident_count integer not null, response_met_rate numeric not null, projected_load numeric not null, capacity_status text not null);",
    "create table customer_retention_signals (tenant_id text not null, review_period text not null, health_score integer not null, renewal_intent text not null, risk_level text not null, expansion_opportunity boolean not null, next_action text not null);",
    "create table billing_evidence_backlog (tenant_id text not null, pricing_objection boolean not null, contract_blockers jsonb not null, requested_terms jsonb not null, procurement_stage text not null, urgency text not null, next_action text not null, review_status text not null);"
  ].join("\n");
}

export function migratePhase14ToGrowthState(seedState = samplePhase14OpsState): Phase15GrowthState {
  const phase14State = clonePhase14State(seedState);
  const operationProfiles = CustomerOperationProfileSchema.array().parse([
    ...phase14State.operation_profiles,
    ...PHASE15_NEW_OPERATION_PROFILES
  ]);
  const privacyScans = [
    scanPhase10Privacy("PRIVACY-GROWTH-001", "tenant", PHASE15_GROWTH_COHORTS),
    scanPhase10Privacy("PRIVACY-GROWTH-002", "tenant", PHASE15_GROWTH_POLICIES),
    scanPhase10Privacy("PRIVACY-GROWTH-003", "tenant", PHASE15_LIFECYCLE_STATES),
    scanPhase10Privacy("PRIVACY-GROWTH-004", "metrics", PHASE15_CAPACITY_FORECASTS),
    scanPhase10Privacy("PRIVACY-GROWTH-005", "metrics", PHASE15_RETENTION_SIGNALS),
    scanPhase10Privacy("PRIVACY-GROWTH-006", "pilot_report", PHASE15_BILLING_EVIDENCE_BACKLOG)
  ];

  return {
    growth_cohorts: PHASE15_GROWTH_COHORTS,
    growth_policies: PHASE15_GROWTH_POLICIES,
    operation_profiles: operationProfiles,
    lifecycle_states: PHASE15_LIFECYCLE_STATES,
    capacity_forecasts: PHASE15_CAPACITY_FORECASTS,
    retention_signals: PHASE15_RETENTION_SIGNALS,
    billing_evidence_backlog: PHASE15_BILLING_EVIDENCE_BACKLOG,
    privacy_scans: privacyScans,
    phase14_state: phase14State
  };
}

export function buildPhase15ExpansionReport(state: Phase15GrowthState): Phase15ExpansionReport {
  const phase14Report = buildPhase14OpsReport(state.phase14_state);
  const portfolio = buildCustomerPortfolioReport(state);
  const activeLifecycles = activeCustomerLifecycles(state);
  const policy = state.growth_policies[0] ?? null;
  const capacityForecast = latestCapacityForecast(state);
  const growthCheckPassed =
    Boolean(policy) &&
    policy.review_status === "approved" &&
    activeLifecycles.length >= 15 &&
    activeLifecycles.length <= policy.max_customer_count &&
    state.growth_cohorts.length >= 4 &&
    state.growth_cohorts.every(
      (cohort) =>
        cohort.status === "active" &&
        cohort.tenant_ids.length === cohort.target_customer_count &&
        policy?.policy_id === cohort.growth_policy_id
    );
  const tenantIsolationPassed = activeLifecycles.every((lifecycle) =>
    activeLifecycles.every((other) =>
      lifecycle.tenant_id === other.tenant_id
        ? canAccessGrowthTenantResource(state, lifecycle.tenant_id, other.tenant_id, "customer_report")
        : !canAccessGrowthTenantResource(state, lifecycle.tenant_id, other.tenant_id, "customer_report")
    )
  );
  const billingEvidenceReady = activeLifecycles.every(
    (lifecycle) =>
      state.billing_evidence_backlog.some((evidence) => evidence.tenant_id === lifecycle.tenant_id) &&
      state.retention_signals.some((signal) => signal.tenant_id === lifecycle.tenant_id)
  );
  const pricingBlockerCount = state.billing_evidence_backlog.filter(
    (evidence) => evidence.pricing_objection || evidence.contract_blockers.length > 0
  ).length;
  const phase16Recommendation = pricingBlockerCount >= 6 ? "start_billing_module" : "continue_expansion";
  const ready =
    phase14Report.go_no_go_decision === "go" &&
    growthCheckPassed &&
    tenantIsolationPassed &&
    portfolio.privacy_check_passed &&
    portfolio.support_capacity_passed &&
    billingEvidenceReady;

  return Phase15ExpansionReportSchema.parse({
    customer_count: portfolio.customer_count,
    active_customer_count: portfolio.active_customer_count,
    growth_check_passed: growthCheckPassed,
    tenant_isolation_passed: tenantIsolationPassed,
    privacy_check_passed: portfolio.privacy_check_passed,
    support_capacity_passed: capacityPassesPolicy(capacityForecast, policy),
    billing_evidence_ready: billingEvidenceReady,
    phase16_recommendation: phase16Recommendation,
    go_no_go_decision: ready ? "go" : "hold"
  });
}

export const samplePhase15GrowthState = migratePhase14ToGrowthState();
export const samplePhase15ExpansionReport = buildPhase15ExpansionReport(samplePhase15GrowthState);
export const samplePhase15GrowthSchema = buildPhase15GrowthPostgresSchemaPreview();
