import { describe, expect, it } from "vitest";

import {
  CommercialCustomerReportSchema,
  CustomerExpansionBatchSchema,
  CustomerHealthScoreSchema,
  CustomerSlaPolicySchema,
  CustomerSuccessReviewSchema,
  CustomerSupportRunbookSchema,
  Phase12ExpansionReportSchema,
  TenantEntitlementSchema
} from "../src/lib/phase12-contracts";
import {
  assertPhase12PrivacyBoundary,
  buildCommercialCustomerReport,
  buildExpansionPostgresSchemaPreview,
  buildPhase12ExpansionReport,
  canAccessTenantResource,
  canCreateCampaignForTenant,
  canEnableThemeForTenant,
  getExpansionApprovedSnapshot,
  migratePhase11ToExpansionState,
  samplePhase12ExpansionReport,
  samplePhase12ExpansionState
} from "../src/lib/phase12-expansion";
import { samplePhase11CommercialState } from "../src/lib/phase11-commercial";

describe("phase 12 commercial customer expansion contracts", () => {
  it("validates expansion batch, entitlement, SLA, health, report, runbook, success review, and phase report schemas", () => {
    expect(() => CustomerExpansionBatchSchema.parse(samplePhase12ExpansionState.expansion_batches[0])).not.toThrow();
    expect(() => TenantEntitlementSchema.parse(samplePhase12ExpansionState.tenant_entitlements[0])).not.toThrow();
    expect(() => CustomerSlaPolicySchema.parse(samplePhase12ExpansionState.sla_policies[0])).not.toThrow();
    expect(() => CustomerHealthScoreSchema.parse(samplePhase12ExpansionState.customer_health_scores[0])).not.toThrow();
    expect(() => CommercialCustomerReportSchema.parse(samplePhase12ExpansionState.customer_reports[0])).not.toThrow();
    expect(() => CustomerSupportRunbookSchema.parse(samplePhase12ExpansionState.support_runbooks[0])).not.toThrow();
    expect(() => CustomerSuccessReviewSchema.parse(samplePhase12ExpansionState.success_reviews[0])).not.toThrow();
    expect(() => Phase12ExpansionReportSchema.parse(samplePhase12ExpansionReport)).not.toThrow();
  });

  it("rejects raw face data, biometric data, ordinary user identity, phone, and device fingerprint fields", () => {
    expect(assertPhase12PrivacyBoundary({ nested: { raw_image: "unsafe" } })).toBe(false);
    expect(assertPhase12PrivacyBoundary({ face_landmarks: [] })).toBe(false);
    expect(assertPhase12PrivacyBoundary({ biometric_template: "unsafe" })).toBe(false);
    expect(assertPhase12PrivacyBoundary({ user_id: "user-1", phone: "123", device_fingerprint: "fp" })).toBe(false);
    expect(
      CustomerExpansionBatchSchema.safeParse({
        ...samplePhase12ExpansionState.expansion_batches[0],
        raw_video: "unsafe"
      }).success
    ).toBe(false);
  });
});

describe("phase 12 migration, tenant isolation, and entitlement limits", () => {
  it("migrates phase 11 state into expansion batches, entitlements, customer reports, and PostgreSQL DDL", () => {
    const state = migratePhase11ToExpansionState(samplePhase11CommercialState);
    const ddl = buildExpansionPostgresSchemaPreview();

    expect(state.phase11_state.commercial_tenants.length).toBe(samplePhase11CommercialState.commercial_tenants.length);
    expect(
      state.tenant_entitlements.filter(
        (entitlement) => entitlement.status === "active" && entitlement.tenant_id !== "TEN-001"
      )
    ).toHaveLength(3);
    expect(state.customer_reports).toHaveLength(3);
    expect(ddl).toContain("create table customer_expansion_batches");
    expect(ddl).toContain("create table tenant_entitlements");
    expect(ddl).toContain("create table customer_support_runbooks");
    expect(ddl).toContain("create table customer_success_reviews");
  });

  it("enforces cross-tenant isolation and tenant entitlements", () => {
    expect(canAccessTenantResource(samplePhase12ExpansionState, "TEN-002", "TEN-002", "customer_report")).toBe(true);
    expect(canAccessTenantResource(samplePhase12ExpansionState, "TEN-002", "TEN-003", "customer_report")).toBe(false);
    expect(canEnableThemeForTenant(samplePhase12ExpansionState, "TEN-002", "THEME-QIANCHENG")).toBe(true);
    expect(canEnableThemeForTenant(samplePhase12ExpansionState, "TEN-002", "THEME-UNAPPROVED")).toBe(false);
    expect(canCreateCampaignForTenant(samplePhase12ExpansionState, "TEN-002", 2)).toBe(true);
    expect(canCreateCampaignForTenant(samplePhase12ExpansionState, "TEN-002", 3)).toBe(false);
  });

  it("serves only active commercial-approved published snapshots to H5", () => {
    const snapshot = getExpansionApprovedSnapshot(samplePhase12ExpansionState, "TEN-001", "CMP-001");

    expect(snapshot?.campaign_id).toBe("CMP-001");

    const suspended = {
      ...samplePhase12ExpansionState,
      tenant_entitlements: samplePhase12ExpansionState.tenant_entitlements.map((entitlement) =>
        entitlement.tenant_id === "TEN-001" ? { ...entitlement, status: "suspended" as const } : entitlement
      )
    };

    expect(getExpansionApprovedSnapshot(suspended, "TEN-001", "CMP-001")).toBeNull();
  });
});

describe("phase 12 customer reports, support readiness, and go report", () => {
  it("builds privacy-clean commercial customer reports per tenant", () => {
    const report = buildCommercialCustomerReport(samplePhase12ExpansionState, "TEN-002");

    expect(report.tenant_id).toBe("TEN-002");
    expect(report.campaign_count).toBeGreaterThanOrEqual(1);
    expect(report.privacy_check_passed).toBe(true);
    expect(assertPhase12PrivacyBoundary(report)).toBe(true);
    expect(JSON.stringify(report)).not.toContain("raw_image");
    expect(JSON.stringify(report)).not.toContain("user_id");
  });

  it("builds a go report when expansion, SLA, isolation, privacy, and support readiness pass", () => {
    const report = buildPhase12ExpansionReport(samplePhase12ExpansionState);

    expect(report.customer_count).toBeGreaterThanOrEqual(3);
    expect(report.active_customer_count).toBe(3);
    expect(report.sla_check_passed).toBe(true);
    expect(report.tenant_isolation_passed).toBe(true);
    expect(report.privacy_check_passed).toBe(true);
    expect(report.support_readiness_passed).toBe(true);
    expect(report.go_no_go_decision).toBe("go");
  });
});
