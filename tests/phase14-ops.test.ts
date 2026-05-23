import { describe, expect, it } from "vitest";

import {
  CustomerAdmissionPolicySchema,
  CustomerOperationProfileSchema,
  CustomerOpsReportPackageSchema,
  CustomerRenewalSignalSchema,
  CustomerScaleWaveSchema,
  Phase14OpsReportSchema,
  SupportCapacitySummarySchema
} from "../src/lib/phase14-contracts";
import {
  assertPhase14PrivacyBoundary,
  buildCustomerOpsReportPackage,
  buildPhase14OpsReport,
  buildStableOpsPostgresSchemaPreview,
  canAccessOpsTenantResource,
  canAdmitCustomerToWave,
  canCreateOpsCampaignForTenant,
  canEnableOpsThemeForTenant,
  getOpsApprovedSnapshot,
  migratePhase13ToOpsState,
  samplePhase14OpsReport,
  samplePhase14OpsState
} from "../src/lib/phase14-ops";
import { samplePhase13ScaleState } from "../src/lib/phase13-scale";

describe("phase 14 stable commercial operations contracts", () => {
  it("validates wave, admission policy, operation profile, renewal signal, support capacity, ops report package, and phase report schemas", () => {
    expect(() => CustomerScaleWaveSchema.parse(samplePhase14OpsState.scale_waves[0])).not.toThrow();
    expect(() => CustomerAdmissionPolicySchema.parse(samplePhase14OpsState.admission_policies[0])).not.toThrow();
    expect(() => CustomerOperationProfileSchema.parse(samplePhase14OpsState.operation_profiles[0])).not.toThrow();
    expect(() => CustomerRenewalSignalSchema.parse(samplePhase14OpsState.renewal_signals[0])).not.toThrow();
    expect(() => SupportCapacitySummarySchema.parse(samplePhase14OpsState.support_capacity_summaries[0])).not.toThrow();
    expect(() => CustomerOpsReportPackageSchema.parse(samplePhase14OpsState.ops_report_packages[0])).not.toThrow();
    expect(() => Phase14OpsReportSchema.parse(samplePhase14OpsReport)).not.toThrow();
  });

  it("rejects raw face data, biometric data, ordinary user identity, phone, and device fingerprint fields", () => {
    expect(assertPhase14PrivacyBoundary({ nested: { raw_image: "unsafe" } })).toBe(false);
    expect(assertPhase14PrivacyBoundary({ face_landmarks: [] })).toBe(false);
    expect(assertPhase14PrivacyBoundary({ biometric_template: "unsafe" })).toBe(false);
    expect(assertPhase14PrivacyBoundary({ user_id: "user-1", phone: "123", device_fingerprint: "fp" })).toBe(false);
    expect(
      CustomerScaleWaveSchema.safeParse({
        ...samplePhase14OpsState.scale_waves[0],
        raw_video: "unsafe"
      }).success
    ).toBe(false);
  });
});

describe("phase 14 migration, tenant isolation, and admission governance", () => {
  it("migrates phase 13 state into scale waves, operation profiles, renewal signals, ops packages, and PostgreSQL DDL", () => {
    const state = migratePhase13ToOpsState(samplePhase13ScaleState);
    const ddl = buildStableOpsPostgresSchemaPreview();

    expect(state.phase13_state.tenant_entitlements.length).toBe(samplePhase13ScaleState.tenant_entitlements.length);
    expect(state.scale_waves).toHaveLength(3);
    expect(
      state.operation_profiles.filter((profile) => profile.status === "active" && profile.tenant_id !== "TEN-001")
    ).toHaveLength(10);
    expect(state.renewal_signals).toHaveLength(10);
    expect(state.ops_report_packages).toHaveLength(10);
    expect(ddl).toContain("create table customer_scale_waves");
    expect(ddl).toContain("create table customer_admission_policies");
    expect(ddl).toContain("create table customer_operation_profiles");
    expect(ddl).toContain("create table customer_ops_report_packages");
  });

  it("enforces tenant isolation, admission policy, theme authorization, and campaign limits", () => {
    expect(canAccessOpsTenantResource(samplePhase14OpsState, "TEN-002", "TEN-002", "customer_report")).toBe(true);
    expect(canAccessOpsTenantResource(samplePhase14OpsState, "TEN-002", "TEN-008", "customer_report")).toBe(false);
    expect(canAdmitCustomerToWave(samplePhase14OpsState, "TEN-011", "WAVE-003")).toBe(true);
    expect(canAdmitCustomerToWave(samplePhase14OpsState, "TEN-016", "WAVE-003")).toBe(false);
    expect(canEnableOpsThemeForTenant(samplePhase14OpsState, "TEN-002", "THEME-QIANCHENG")).toBe(true);
    expect(canEnableOpsThemeForTenant(samplePhase14OpsState, "TEN-002", "THEME-UNAPPROVED")).toBe(false);
    expect(canCreateOpsCampaignForTenant(samplePhase14OpsState, "TEN-002", 2)).toBe(true);
    expect(canCreateOpsCampaignForTenant(samplePhase14OpsState, "TEN-002", 3)).toBe(false);
  });

  it("serves only active commercial-approved published snapshots to H5", () => {
    const snapshot = getOpsApprovedSnapshot(samplePhase14OpsState, "TEN-001", "CMP-001");

    expect(snapshot?.campaign_id).toBe("CMP-001");

    const suspended = {
      ...samplePhase14OpsState,
      operation_profiles: samplePhase14OpsState.operation_profiles.map((profile) =>
        profile.tenant_id === "TEN-001" ? { ...profile, status: "suspended" as const } : profile
      )
    };

    expect(getOpsApprovedSnapshot(suspended, "TEN-001", "CMP-001")).toBeNull();
  });
});

describe("phase 14 ops packages, support capacity, renewal signals, and go report", () => {
  it("builds privacy-clean ops report packages with health and renewal references", () => {
    const reportPackage = buildCustomerOpsReportPackage(samplePhase14OpsState, "TEN-002");

    expect(reportPackage.tenant_id).toBe("TEN-002");
    expect(reportPackage.report_id).toMatch(/^OPS-RPT-\d{3}$/);
    expect(reportPackage.health_trend_id).toMatch(/^HEALTH-\d{3}$/);
    expect(reportPackage.renewal_signal_id).toMatch(/^RENEWAL-\d{3}$/);
    expect(assertPhase14PrivacyBoundary(reportPackage)).toBe(true);
    expect(JSON.stringify(reportPackage)).not.toContain("raw_image");
    expect(JSON.stringify(reportPackage)).not.toContain("user_id");
  });

  it("builds a go report when stable operations, support capacity, privacy, and billing readiness evidence pass", () => {
    const report = buildPhase14OpsReport(samplePhase14OpsState);

    expect(report.customer_count).toBeGreaterThanOrEqual(10);
    expect(report.customer_count).toBeLessThanOrEqual(15);
    expect(report.active_customer_count).toBe(10);
    expect(report.wave_count).toBe(3);
    expect(report.admission_check_passed).toBe(true);
    expect(report.sla_check_passed).toBe(true);
    expect(report.tenant_isolation_passed).toBe(true);
    expect(report.privacy_check_passed).toBe(true);
    expect(report.support_capacity_passed).toBe(true);
    expect(report.billing_readiness_signal).toBe("collect_evidence");
    expect(report.go_no_go_decision).toBe("go");
  });
});
