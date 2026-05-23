import {
  CustomerAdmissionPolicySchema,
  CustomerOperationProfileSchema,
  CustomerOpsReportPackageSchema,
  CustomerRenewalSignalSchema,
  CustomerScaleWaveSchema,
  Phase14OpsReportSchema,
  SupportCapacitySummarySchema,
  type CustomerAdmissionPolicy,
  type CustomerOperationProfile,
  type CustomerOpsReportPackage,
  type CustomerRenewalSignal,
  type CustomerScaleWave,
  type Phase14OpsReport,
  type SupportCapacitySummary
} from "./phase14-contracts";
import type { CustomerResourceType } from "./phase12-contracts";
import {
  assertPhase13PrivacyBoundary,
  buildPhase13ScaleReport,
  getScaleApprovedSnapshot,
  samplePhase13ScaleState,
  type Phase13ScaleState
} from "./phase13-scale";
import { scanPhase10Privacy } from "./phase10-pilot";
import { phase9DefaultTenantId } from "./phase9-saas";
import type { PublishedConfigSnapshot } from "./phase9-contracts";

const REVIEWED_AT = "2026-05-01T00:00:00.000Z";
const INTERNAL_TENANT_ID = phase9DefaultTenantId;
const OPS_CUSTOMER_IDS = [
  "TEN-002",
  "TEN-003",
  "TEN-004",
  "TEN-005",
  "TEN-006",
  "TEN-007",
  "TEN-008",
  "TEN-009",
  "TEN-010",
  "TEN-011"
] as const;
const THEME_ALIASES: Record<string, string> = {
  "THEME-QIANCHENG": "THEME-QIANCHENG-001",
  "THEME-SHANHE": "THEME-SHANHE-001"
};

export type Phase14OpsState = {
  scale_waves: CustomerScaleWave[];
  admission_policies: CustomerAdmissionPolicy[];
  operation_profiles: CustomerOperationProfile[];
  renewal_signals: CustomerRenewalSignal[];
  support_capacity_summaries: SupportCapacitySummary[];
  ops_report_packages: CustomerOpsReportPackage[];
  privacy_scans: ReturnType<typeof scanPhase10Privacy>[];
  phase13_state: Phase13ScaleState;
};

export const PHASE14_ADMISSION_POLICIES: CustomerAdmissionPolicy[] =
  CustomerAdmissionPolicySchema.array().parse([
    {
      policy_id: "ADMISSION-001",
      max_customer_count: 15,
      required_reviews: ["operations", "compliance", "legal"],
      allowed_service_tiers: ["starter", "professional", "enterprise_trial"],
      stop_conditions: [
        "Any privacy scan fails.",
        "Open support incidents exceed manual capacity.",
        "Tenant isolation check fails.",
        "Customer requests public signup, billing, or hardware before governance is ready."
      ],
      review_status: "approved"
    }
  ]);

export const PHASE14_SCALE_WAVES: CustomerScaleWave[] = CustomerScaleWaveSchema.array().parse([
  {
    wave_id: "WAVE-001",
    started_at: REVIEWED_AT,
    ended_at: null,
    target_customer_count: 4,
    tenant_ids: ["TEN-002", "TEN-003", "TEN-004", "TEN-005"],
    admission_policy_id: "ADMISSION-001",
    owner_role: "operations",
    status: "active"
  },
  {
    wave_id: "WAVE-002",
    started_at: REVIEWED_AT,
    ended_at: null,
    target_customer_count: 3,
    tenant_ids: ["TEN-006", "TEN-007", "TEN-008"],
    admission_policy_id: "ADMISSION-001",
    owner_role: "operations",
    status: "active"
  },
  {
    wave_id: "WAVE-003",
    started_at: REVIEWED_AT,
    ended_at: null,
    target_customer_count: 3,
    tenant_ids: ["TEN-009", "TEN-010", "TEN-011"],
    admission_policy_id: "ADMISSION-001",
    owner_role: "operations",
    status: "active"
  }
]);

export const PHASE14_OPERATION_PROFILES: CustomerOperationProfile[] =
  CustomerOperationProfileSchema.array().parse([
    {
      tenant_id: INTERNAL_TENANT_ID,
      service_tier: "enterprise_trial",
      support_owner: "support@xiangmian.example",
      privacy_owner: "privacy@xiangmian.example",
      contract_contact: "contracts@xiangmian.example",
      allowed_campaign_count: 4,
      allowed_theme_ids: ["THEME-QIANCHENG-001", "THEME-SHANHE-001"],
      status: "active"
    },
    ...OPS_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      service_tier:
        index === 5 ? "enterprise_trial" : index % 3 === 0 ? "professional" : "starter",
      support_owner: `support-${tenantId.toLowerCase()}@xiangmian.example`,
      privacy_owner: `privacy-${tenantId.toLowerCase()}@xiangmian.example`,
      contract_contact: `contract-${tenantId.toLowerCase()}@xiangmian.example`,
      allowed_campaign_count: index % 3 === 1 ? 1 : 2,
      allowed_theme_ids:
        index % 3 === 1
          ? ["THEME-SHANHE-001"]
          : ["THEME-QIANCHENG-001", "THEME-SHANHE-001"],
      status: "active"
    }))
  ]);

export const PHASE14_RENEWAL_SIGNALS: CustomerRenewalSignal[] =
  CustomerRenewalSignalSchema.array().parse(
    OPS_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      review_period: "2026-W20",
      renewal_intent: index === 8 ? "neutral" : "positive",
      pricing_objection: index === 8,
      requested_features: index === 8 ? ["billing evidence export"] : ["monthly ops report"],
      blocking_issues: [],
      next_action: index === 8 ? "Collect pricing objection evidence for Phase 15." : "Keep weekly success review."
    }))
  );

export const PHASE14_SUPPORT_CAPACITY_SUMMARIES: SupportCapacitySummary[] =
  SupportCapacitySummarySchema.array().parse([
    {
      period: "2026-W20",
      active_customer_count: 10,
      incident_count: 3,
      open_incident_count: 0,
      response_met_rate: 0.94,
      review_completion_rate: 1,
      capacity_status: "healthy"
    }
  ]);

export const PHASE14_OPS_REPORT_PACKAGES: CustomerOpsReportPackage[] =
  CustomerOpsReportPackageSchema.array().parse(
    OPS_CUSTOMER_IDS.map((tenantId, index) => ({
      tenant_id: tenantId,
      report_id: `OPS-RPT-${String(index + 1).padStart(3, "0")}`,
      metrics_summary_id: `METRICS-${String(index + 1).padStart(3, "0")}`,
      privacy_scan_id: `PRIVACY-${String(index + 1).padStart(3, "0")}`,
      audit_summary_id: `AUDIT-SUMMARY-${String(index + 1).padStart(3, "0")}`,
      support_summary_id: `SUPPORT-SUMMARY-${String(index + 1).padStart(3, "0")}`,
      health_trend_id: `HEALTH-${String(index + 1).padStart(3, "0")}`,
      renewal_signal_id: `RENEWAL-${String(index + 1).padStart(3, "0")}`,
      generated_at: REVIEWED_AT
    }))
  );

function clonePhase13State(state: Phase13ScaleState): Phase13ScaleState {
  return JSON.parse(JSON.stringify(state)) as Phase13ScaleState;
}

function normalizeThemeId(themeId: string): string {
  return THEME_ALIASES[themeId] ?? themeId;
}

function operationProfileByTenant(state: Phase14OpsState, tenantId: string): CustomerOperationProfile | null {
  return state.operation_profiles.find((profile) => profile.tenant_id === tenantId) ?? null;
}

function activeCustomerProfiles(state: Phase14OpsState): CustomerOperationProfile[] {
  return state.operation_profiles.filter(
    (profile) => profile.tenant_id !== INTERNAL_TENANT_ID && profile.status === "active"
  );
}

function admissionPolicyById(state: Phase14OpsState, policyId: string): CustomerAdmissionPolicy | null {
  return state.admission_policies.find((policy) => policy.policy_id === policyId) ?? null;
}

export function assertPhase14PrivacyBoundary(payload: unknown): boolean {
  return assertPhase13PrivacyBoundary(payload) && scanPhase10Privacy("PRIVACY-PHASE14", "metrics", payload).passed;
}

export function canAccessOpsTenantResource(
  state: Phase14OpsState,
  actorTenantId: string,
  targetTenantId: string,
  _resourceType: CustomerResourceType
): boolean {
  const actorProfile = operationProfileByTenant(state, actorTenantId);
  const targetProfile = operationProfileByTenant(state, targetTenantId);

  return Boolean(
    actorProfile &&
      targetProfile &&
      actorProfile.status === "active" &&
      targetProfile.status === "active" &&
      actorTenantId === targetTenantId
  );
}

export function canAdmitCustomerToWave(
  state: Phase14OpsState,
  tenantId: string,
  waveId: string
): boolean {
  const wave = state.scale_waves.find((item) => item.wave_id === waveId);
  const profile = operationProfileByTenant(state, tenantId);
  const policy = wave ? admissionPolicyById(state, wave.admission_policy_id) : null;
  const activeCount = activeCustomerProfiles(state).length;

  return Boolean(
    wave &&
      profile &&
      policy &&
      wave.status === "active" &&
      profile.status === "active" &&
      wave.tenant_ids.includes(tenantId) &&
      activeCount <= policy.max_customer_count &&
      policy.review_status === "approved" &&
      policy.allowed_service_tiers.includes(profile.service_tier)
  );
}

export function canEnableOpsThemeForTenant(
  state: Phase14OpsState,
  tenantId: string,
  themeId: string
): boolean {
  const profile = operationProfileByTenant(state, tenantId);

  return Boolean(
    profile &&
      profile.status === "active" &&
      profile.allowed_theme_ids.includes(normalizeThemeId(themeId))
  );
}

export function canCreateOpsCampaignForTenant(
  state: Phase14OpsState,
  tenantId: string,
  nextCampaignCount: number
): boolean {
  const profile = operationProfileByTenant(state, tenantId);

  return Boolean(
    profile &&
      profile.status === "active" &&
      nextCampaignCount <= profile.allowed_campaign_count
  );
}

export function buildCustomerOpsReportPackage(
  state: Phase14OpsState,
  tenantId: string
): CustomerOpsReportPackage {
  const existing = state.ops_report_packages.find((reportPackage) => reportPackage.tenant_id === tenantId);

  if (existing) {
    return CustomerOpsReportPackageSchema.parse(existing);
  }

  const index = state.ops_report_packages.length + 1;

  return CustomerOpsReportPackageSchema.parse({
    tenant_id: tenantId,
    report_id: `OPS-RPT-${String(index).padStart(3, "0")}`,
    metrics_summary_id: `METRICS-${String(index).padStart(3, "0")}`,
    privacy_scan_id: `PRIVACY-${String(index).padStart(3, "0")}`,
    audit_summary_id: `AUDIT-SUMMARY-${String(index).padStart(3, "0")}`,
    support_summary_id: `SUPPORT-SUMMARY-${String(index).padStart(3, "0")}`,
    health_trend_id: `HEALTH-${String(index).padStart(3, "0")}`,
    renewal_signal_id: `RENEWAL-${String(index).padStart(3, "0")}`,
    generated_at: REVIEWED_AT
  });
}

export function getOpsApprovedSnapshot(
  state: Phase14OpsState,
  tenantId: string,
  campaignId: string
): PublishedConfigSnapshot | null {
  const profile = operationProfileByTenant(state, tenantId);

  if (!profile || profile.status !== "active") {
    return null;
  }

  return getScaleApprovedSnapshot(state.phase13_state, tenantId, campaignId);
}

export function buildStableOpsPostgresSchemaPreview(): string {
  return [
    "create table customer_scale_waves (wave_id text primary key, started_at timestamptz not null, ended_at timestamptz, target_customer_count integer not null, tenant_ids jsonb not null, admission_policy_id text not null, owner_role text not null, status text not null);",
    "create table customer_admission_policies (policy_id text primary key, max_customer_count integer not null, required_reviews jsonb not null, allowed_service_tiers jsonb not null, stop_conditions jsonb not null, review_status text not null);",
    "create table customer_operation_profiles (tenant_id text primary key, service_tier text not null, support_owner text not null, privacy_owner text not null, contract_contact text not null, allowed_campaign_count integer not null, allowed_theme_ids jsonb not null, status text not null);",
    "create table customer_renewal_signals (tenant_id text not null, review_period text not null, renewal_intent text not null, pricing_objection boolean not null, requested_features jsonb not null, blocking_issues jsonb not null, next_action text not null);",
    "create table support_capacity_summaries (period text primary key, active_customer_count integer not null, incident_count integer not null, open_incident_count integer not null, response_met_rate numeric not null, review_completion_rate numeric not null, capacity_status text not null);",
    "create table customer_ops_report_packages (tenant_id text not null, report_id text not null, metrics_summary_id text not null, privacy_scan_id text not null, audit_summary_id text not null, support_summary_id text not null, health_trend_id text not null, renewal_signal_id text not null, generated_at timestamptz not null);"
  ].join("\n");
}

export function migratePhase13ToOpsState(
  seedState = samplePhase13ScaleState
): Phase14OpsState {
  const phase13State = clonePhase13State(seedState);
  const privacyScans = [
    scanPhase10Privacy("PRIVACY-OPS-001", "tenant", PHASE14_SCALE_WAVES),
    scanPhase10Privacy("PRIVACY-OPS-002", "tenant", PHASE14_ADMISSION_POLICIES),
    scanPhase10Privacy("PRIVACY-OPS-003", "tenant", PHASE14_OPERATION_PROFILES),
    scanPhase10Privacy("PRIVACY-OPS-004", "metrics", PHASE14_RENEWAL_SIGNALS),
    scanPhase10Privacy("PRIVACY-OPS-005", "metrics", PHASE14_SUPPORT_CAPACITY_SUMMARIES),
    scanPhase10Privacy("PRIVACY-OPS-006", "pilot_report", PHASE14_OPS_REPORT_PACKAGES)
  ];

  return {
    scale_waves: PHASE14_SCALE_WAVES,
    admission_policies: PHASE14_ADMISSION_POLICIES,
    operation_profiles: PHASE14_OPERATION_PROFILES,
    renewal_signals: PHASE14_RENEWAL_SIGNALS,
    support_capacity_summaries: PHASE14_SUPPORT_CAPACITY_SUMMARIES,
    ops_report_packages: PHASE14_OPS_REPORT_PACKAGES,
    privacy_scans: privacyScans,
    phase13_state: phase13State
  };
}

export function buildPhase14OpsReport(state: Phase14OpsState): Phase14OpsReport {
  const phase13Report = buildPhase13ScaleReport(state.phase13_state);
  const customerProfiles = state.operation_profiles.filter((profile) => profile.tenant_id !== INTERNAL_TENANT_ID);
  const activeProfiles = activeCustomerProfiles(state);
  const admissionPolicy = state.admission_policies[0];
  const waveReady =
    state.scale_waves.length >= 3 &&
    state.scale_waves.every(
      (wave) =>
        wave.status === "active" &&
        wave.tenant_ids.length === wave.target_customer_count &&
        admissionPolicy?.policy_id === wave.admission_policy_id
    );
  const admissionCheckPassed =
    Boolean(admissionPolicy) &&
    admissionPolicy.review_status === "approved" &&
    activeProfiles.length >= 10 &&
    activeProfiles.length <= admissionPolicy.max_customer_count &&
    activeProfiles.every((profile) => admissionPolicy.allowed_service_tiers.includes(profile.service_tier)) &&
    waveReady;
  const slaCheckPassed = state.support_capacity_summaries.every(
    (summary) =>
      summary.response_met_rate >= 0.9 &&
      summary.review_completion_rate >= 0.95 &&
      summary.open_incident_count === 0
  );
  const tenantIsolationPassed = customerProfiles.every((profile) =>
    customerProfiles.every((other) =>
      profile.tenant_id === other.tenant_id
        ? canAccessOpsTenantResource(state, profile.tenant_id, other.tenant_id, "customer_report")
        : !canAccessOpsTenantResource(state, profile.tenant_id, other.tenant_id, "customer_report")
    )
  );
  const privacyCheckPassed =
    state.privacy_scans.every((scan) => scan.passed) &&
    state.ops_report_packages.every((reportPackage) => assertPhase14PrivacyBoundary(reportPackage)) &&
    assertPhase14PrivacyBoundary(state);
  const supportCapacityPassed = state.support_capacity_summaries.every(
    (summary) => summary.capacity_status !== "overloaded" && summary.open_incident_count === 0
  );
  const reportCoveragePassed = activeProfiles.every(
    (profile) =>
      state.ops_report_packages.some((reportPackage) => reportPackage.tenant_id === profile.tenant_id) &&
      state.renewal_signals.some((signal) => signal.tenant_id === profile.tenant_id)
  );
  const billingReadinessSignal =
    state.renewal_signals.some((signal) => signal.pricing_objection || signal.requested_features.length > 0)
      ? "collect_evidence"
      : "defer";
  const ready =
    phase13Report.go_no_go_decision === "go" &&
    admissionCheckPassed &&
    slaCheckPassed &&
    tenantIsolationPassed &&
    privacyCheckPassed &&
    supportCapacityPassed &&
    reportCoveragePassed;

  return Phase14OpsReportSchema.parse({
    customer_count: customerProfiles.length,
    active_customer_count: activeProfiles.length,
    wave_count: state.scale_waves.length,
    admission_check_passed: admissionCheckPassed,
    sla_check_passed: slaCheckPassed,
    tenant_isolation_passed: tenantIsolationPassed,
    privacy_check_passed: privacyCheckPassed,
    support_capacity_passed: supportCapacityPassed,
    billing_readiness_signal: billingReadinessSignal,
    go_no_go_decision: ready ? "go" : "hold"
  });
}

export const samplePhase14OpsState = migratePhase13ToOpsState();
export const samplePhase14OpsReport = buildPhase14OpsReport(samplePhase14OpsState);
export const samplePhase14OpsSchema = buildStableOpsPostgresSchemaPreview();
