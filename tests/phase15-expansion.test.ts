import { describe, expect, it } from "vitest";

import {
  BillingEvidenceBacklogSchema,
  CustomerGrowthCohortSchema,
  CustomerGrowthPolicySchema,
  CustomerLifecycleStateSchema,
  CustomerPortfolioReportSchema,
  CustomerRetentionSignalSchema,
  GrowthCapacityForecastSchema,
  Phase15ExpansionReportSchema
} from "../src/lib/phase15-contracts";
import {
  assertPhase15PrivacyBoundary,
  buildCustomerPortfolioReport,
  buildPhase15ExpansionReport,
  buildPhase15GrowthPostgresSchemaPreview,
  canAccessGrowthTenantResource,
  canAdmitCustomerToCohort,
  canCreateGrowthCampaignForTenant,
  canEnableGrowthThemeForTenant,
  getGrowthApprovedSnapshot,
  migratePhase14ToGrowthState,
  samplePhase15ExpansionReport,
  samplePhase15GrowthState
} from "../src/lib/phase15-growth";
import { samplePhase14OpsState } from "../src/lib/phase14-ops";

describe("phase 15 commercial expansion contracts", () => {
  it("validates growth cohort, policy, lifecycle, forecast, retention, billing evidence, portfolio, and phase report schemas", () => {
    expect(() => CustomerGrowthCohortSchema.parse(samplePhase15GrowthState.growth_cohorts[0])).not.toThrow();
    expect(() => CustomerGrowthPolicySchema.parse(samplePhase15GrowthState.growth_policies[0])).not.toThrow();
    expect(() => CustomerLifecycleStateSchema.parse(samplePhase15GrowthState.lifecycle_states[0])).not.toThrow();
    expect(() => GrowthCapacityForecastSchema.parse(samplePhase15GrowthState.capacity_forecasts[0])).not.toThrow();
    expect(() => CustomerRetentionSignalSchema.parse(samplePhase15GrowthState.retention_signals[0])).not.toThrow();
    expect(() => BillingEvidenceBacklogSchema.parse(samplePhase15GrowthState.billing_evidence_backlog[0])).not.toThrow();
    expect(() => CustomerPortfolioReportSchema.parse(buildCustomerPortfolioReport(samplePhase15GrowthState))).not.toThrow();
    expect(() => Phase15ExpansionReportSchema.parse(samplePhase15ExpansionReport)).not.toThrow();
  });

  it("rejects raw face data, biometric data, ordinary user identity, phone, and device fingerprint fields", () => {
    expect(assertPhase15PrivacyBoundary({ nested: { raw_image: "unsafe" } })).toBe(false);
    expect(assertPhase15PrivacyBoundary({ face_landmarks: [] })).toBe(false);
    expect(assertPhase15PrivacyBoundary({ biometric_template: "unsafe" })).toBe(false);
    expect(assertPhase15PrivacyBoundary({ user_id: "user-1", phone: "123", device_fingerprint: "fp" })).toBe(false);
    expect(
      CustomerGrowthCohortSchema.safeParse({
        ...samplePhase15GrowthState.growth_cohorts[0],
        raw_video: "unsafe"
      }).success
    ).toBe(false);
  });
});

describe("phase 15 migration, tenant isolation, and growth governance", () => {
  it("migrates phase 14 state into growth cohorts, lifecycle states, retention signals, billing evidence, and PostgreSQL DDL", () => {
    const state = migratePhase14ToGrowthState(samplePhase14OpsState);
    const ddl = buildPhase15GrowthPostgresSchemaPreview();

    expect(state.phase14_state.operation_profiles.length).toBe(samplePhase14OpsState.operation_profiles.length);
    expect(state.operation_profiles.length).toBeGreaterThan(samplePhase14OpsState.operation_profiles.length);
    expect(state.growth_cohorts).toHaveLength(4);
    expect(
      state.lifecycle_states.filter((lifecycle) => lifecycle.lifecycle_status === "stable" && lifecycle.tenant_id !== "TEN-001")
    ).toHaveLength(16);
    expect(state.retention_signals).toHaveLength(16);
    expect(state.billing_evidence_backlog).toHaveLength(16);
    expect(ddl).toContain("create table customer_growth_cohorts");
    expect(ddl).toContain("create table customer_growth_policies");
    expect(ddl).toContain("create table customer_lifecycle_states");
    expect(ddl).toContain("create table billing_evidence_backlog");
  });

  it("enforces tenant isolation, growth admission, theme authorization, campaign limits, and capacity stops", () => {
    expect(canAccessGrowthTenantResource(samplePhase15GrowthState, "TEN-012", "TEN-012", "customer_report")).toBe(true);
    expect(canAccessGrowthTenantResource(samplePhase15GrowthState, "TEN-012", "TEN-015", "customer_report")).toBe(false);
    expect(canAdmitCustomerToCohort(samplePhase15GrowthState, "TEN-017", "COHORT-004")).toBe(true);
    expect(canAdmitCustomerToCohort(samplePhase15GrowthState, "TEN-030", "COHORT-004")).toBe(false);
    expect(canEnableGrowthThemeForTenant(samplePhase15GrowthState, "TEN-012", "THEME-QIANCHENG")).toBe(true);
    expect(canEnableGrowthThemeForTenant(samplePhase15GrowthState, "TEN-012", "THEME-UNAPPROVED")).toBe(false);
    expect(canCreateGrowthCampaignForTenant(samplePhase15GrowthState, "TEN-012", 2)).toBe(true);
    expect(canCreateGrowthCampaignForTenant(samplePhase15GrowthState, "TEN-012", 4)).toBe(false);

    const overloaded = {
      ...samplePhase15GrowthState,
      capacity_forecasts: samplePhase15GrowthState.capacity_forecasts.map((forecast) => ({
        ...forecast,
        capacity_status: "overloaded" as const,
        open_incident_count: 4
      }))
    };

    expect(canAdmitCustomerToCohort(overloaded, "TEN-017", "COHORT-004")).toBe(false);
  });

  it("serves only stable active commercial-approved published snapshots to H5", () => {
    const snapshot = getGrowthApprovedSnapshot(samplePhase15GrowthState, "TEN-001", "CMP-001");

    expect(snapshot?.campaign_id).toBe("CMP-001");

    const paused = {
      ...samplePhase15GrowthState,
      lifecycle_states: samplePhase15GrowthState.lifecycle_states.map((lifecycle) =>
        lifecycle.tenant_id === "TEN-001" ? { ...lifecycle, lifecycle_status: "paused" as const } : lifecycle
      )
    };

    expect(getGrowthApprovedSnapshot(paused, "TEN-001", "CMP-001")).toBeNull();
  });
});

describe("phase 15 portfolio reports, billing evidence, capacity forecast, and go report", () => {
  it("builds a privacy-clean portfolio report with retention risk and support capacity status", () => {
    const portfolio = buildCustomerPortfolioReport(samplePhase15GrowthState);

    expect(portfolio.customer_count).toBeGreaterThanOrEqual(15);
    expect(portfolio.customer_count).toBeLessThanOrEqual(25);
    expect(portfolio.active_customer_count).toBe(16);
    expect(portfolio.cohort_count).toBe(4);
    expect(portfolio.onboarding_completion_rate).toBe(1);
    expect(portfolio.retention_risk_count).toBe(1);
    expect(assertPhase15PrivacyBoundary(portfolio)).toBe(true);
    expect(JSON.stringify(portfolio)).not.toContain("raw_image");
    expect(JSON.stringify(portfolio)).not.toContain("user_id");
  });

  it("builds a go report when growth, support capacity, privacy, and billing evidence pass", () => {
    const report = buildPhase15ExpansionReport(samplePhase15GrowthState);

    expect(report.customer_count).toBeGreaterThanOrEqual(15);
    expect(report.customer_count).toBeLessThanOrEqual(25);
    expect(report.active_customer_count).toBe(16);
    expect(report.growth_check_passed).toBe(true);
    expect(report.tenant_isolation_passed).toBe(true);
    expect(report.privacy_check_passed).toBe(true);
    expect(report.support_capacity_passed).toBe(true);
    expect(report.billing_evidence_ready).toBe(true);
    expect(report.phase16_recommendation).toBe("continue_expansion");
    expect(report.go_no_go_decision).toBe("go");
  });
});
