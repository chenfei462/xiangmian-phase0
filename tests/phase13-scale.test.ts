import { describe, expect, it } from "vitest";

import {
  CustomerHealthTrendSchema,
  CustomerOnboardingRunSchema,
  CustomerReportPackageSchema,
  CustomerScaleBatchSchema,
  Phase13ScaleReportSchema,
  ScaleReadinessGateSchema,
  SlaPerformanceSummarySchema
} from "../src/lib/phase13-contracts";
import {
  assertPhase13PrivacyBoundary,
  buildCustomerReportPackage,
  buildPhase13ScaleReport,
  buildScalePostgresSchemaPreview,
  canAccessScaleTenantResource,
  canCreateScaleCampaignForTenant,
  canEnableScaleThemeForTenant,
  canExportScaleReportForTenant,
  getScaleApprovedSnapshot,
  migratePhase12ToScaleState,
  samplePhase13ScaleReport,
  samplePhase13ScaleState
} from "../src/lib/phase13-scale";
import { samplePhase12ExpansionState } from "../src/lib/phase12-expansion";

describe("phase 13 commercial scale contracts", () => {
  it("validates scale batch, onboarding, health trend, SLA performance, report package, readiness gate, and phase report schemas", () => {
    expect(() => CustomerScaleBatchSchema.parse(samplePhase13ScaleState.scale_batches[0])).not.toThrow();
    expect(() => CustomerOnboardingRunSchema.parse(samplePhase13ScaleState.onboarding_runs[0])).not.toThrow();
    expect(() => CustomerHealthTrendSchema.parse(samplePhase13ScaleState.health_trends[0])).not.toThrow();
    expect(() => SlaPerformanceSummarySchema.parse(samplePhase13ScaleState.sla_performance_summaries[0])).not.toThrow();
    expect(() => CustomerReportPackageSchema.parse(samplePhase13ScaleState.report_packages[0])).not.toThrow();
    expect(() => ScaleReadinessGateSchema.parse(samplePhase13ScaleState.readiness_gates[0])).not.toThrow();
    expect(() => Phase13ScaleReportSchema.parse(samplePhase13ScaleReport)).not.toThrow();
  });

  it("rejects raw face data, biometric data, ordinary user identity, phone, and device fingerprint fields", () => {
    expect(assertPhase13PrivacyBoundary({ nested: { raw_image: "unsafe" } })).toBe(false);
    expect(assertPhase13PrivacyBoundary({ face_landmarks: [] })).toBe(false);
    expect(assertPhase13PrivacyBoundary({ biometric_template: "unsafe" })).toBe(false);
    expect(assertPhase13PrivacyBoundary({ user_id: "user-1", phone: "123", device_fingerprint: "fp" })).toBe(false);
    expect(
      CustomerScaleBatchSchema.safeParse({
        ...samplePhase13ScaleState.scale_batches[0],
        raw_video: "unsafe"
      }).success
    ).toBe(false);
  });
});

describe("phase 13 migration, tenant isolation, and entitlement limits", () => {
  it("migrates phase 12 state into scale batches, onboarding runs, report packages, and PostgreSQL DDL", () => {
    const state = migratePhase12ToScaleState(samplePhase12ExpansionState);
    const ddl = buildScalePostgresSchemaPreview();

    expect(state.phase12_state.tenant_entitlements.length).toBe(samplePhase12ExpansionState.tenant_entitlements.length);
    expect(state.scale_batches).toHaveLength(2);
    expect(
      state.tenant_entitlements.filter(
        (entitlement) => entitlement.status === "active" && entitlement.tenant_id !== "TEN-001"
      )
    ).toHaveLength(6);
    expect(state.onboarding_runs).toHaveLength(6);
    expect(state.report_packages).toHaveLength(6);
    expect(ddl).toContain("create table customer_scale_batches");
    expect(ddl).toContain("create table customer_onboarding_runs");
    expect(ddl).toContain("create table sla_performance_summaries");
    expect(ddl).toContain("create table customer_report_packages");
  });

  it("enforces scale tenant isolation, theme authorization, campaign limits, and report export limits", () => {
    expect(canAccessScaleTenantResource(samplePhase13ScaleState, "TEN-002", "TEN-002", "customer_report")).toBe(true);
    expect(canAccessScaleTenantResource(samplePhase13ScaleState, "TEN-002", "TEN-005", "customer_report")).toBe(false);
    expect(canEnableScaleThemeForTenant(samplePhase13ScaleState, "TEN-002", "THEME-QIANCHENG")).toBe(true);
    expect(canEnableScaleThemeForTenant(samplePhase13ScaleState, "TEN-002", "THEME-UNAPPROVED")).toBe(false);
    expect(canCreateScaleCampaignForTenant(samplePhase13ScaleState, "TEN-002", 2)).toBe(true);
    expect(canCreateScaleCampaignForTenant(samplePhase13ScaleState, "TEN-002", 3)).toBe(false);
    expect(canExportScaleReportForTenant(samplePhase13ScaleState, "TEN-002", "TEN-002")).toBe(true);
    expect(canExportScaleReportForTenant(samplePhase13ScaleState, "TEN-002", "TEN-003")).toBe(false);
  });

  it("serves only active commercial-approved published snapshots to H5", () => {
    const snapshot = getScaleApprovedSnapshot(samplePhase13ScaleState, "TEN-001", "CMP-001");

    expect(snapshot?.campaign_id).toBe("CMP-001");

    const suspended = {
      ...samplePhase13ScaleState,
      tenant_entitlements: samplePhase13ScaleState.tenant_entitlements.map((entitlement) =>
        entitlement.tenant_id === "TEN-001" ? { ...entitlement, status: "suspended" as const } : entitlement
      )
    };

    expect(getScaleApprovedSnapshot(suspended, "TEN-001", "CMP-001")).toBeNull();
  });
});

describe("phase 13 report packages, SLA readiness, and go report", () => {
  it("builds privacy-clean customer report packages per active tenant", () => {
    const reportPackage = buildCustomerReportPackage(samplePhase13ScaleState, "TEN-002");

    expect(reportPackage.tenant_id).toBe("TEN-002");
    expect(reportPackage.report_id).toMatch(/^RPT-\d{3}$/);
    expect(reportPackage.audit_summary_id).toMatch(/^AUDIT-SUMMARY-\d{3}$/);
    expect(assertPhase13PrivacyBoundary(reportPackage)).toBe(true);
    expect(JSON.stringify(reportPackage)).not.toContain("raw_image");
    expect(JSON.stringify(reportPackage)).not.toContain("user_id");
  });

  it("builds a go report when scale batches, onboarding, SLA, isolation, privacy, and support load pass", () => {
    const report = buildPhase13ScaleReport(samplePhase13ScaleState);

    expect(report.customer_count).toBeGreaterThanOrEqual(6);
    expect(report.customer_count).toBeLessThanOrEqual(10);
    expect(report.active_customer_count).toBe(6);
    expect(report.batch_count).toBe(2);
    expect(report.onboarding_check_passed).toBe(true);
    expect(report.sla_check_passed).toBe(true);
    expect(report.tenant_isolation_passed).toBe(true);
    expect(report.privacy_check_passed).toBe(true);
    expect(report.support_load_acceptable).toBe(true);
    expect(report.go_no_go_decision).toBe("go");
  });
});
