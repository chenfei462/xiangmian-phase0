import { describe, expect, it } from "vitest";

import {
  AdminAuthSessionSchema,
  CommercialExportPackageSchema,
  CommercialTenantSchema,
  CustomerOnboardingChecklistSchema,
  ManagedDatabaseStatusSchema,
  Phase11CommercialReportSchema,
  SupportIncidentSchema,
  TenantPermissionCheckSchema
} from "../src/lib/phase11-contracts";
import {
  buildCommercialExportPackage,
  buildManagedPostgresSchemaPreview,
  buildPhase11CommercialReport,
  checkTenantPermission,
  getCommercialApprovedSnapshot,
  migratePhase10ToCommercialState,
  samplePhase11CommercialReport,
  samplePhase11CommercialState,
  assertPhase11PrivacyBoundary
} from "../src/lib/phase11-commercial";
import { samplePhase10PilotState } from "../src/lib/phase10-pilot";

describe("phase 11 commercial SaaS contracts", () => {
  it("validates commercial tenant, session, permission, database, onboarding, export, incident, and report schemas", () => {
    expect(() => CommercialTenantSchema.parse(samplePhase11CommercialState.commercial_tenants[0])).not.toThrow();
    expect(() => AdminAuthSessionSchema.parse(samplePhase11CommercialState.auth_sessions[0])).not.toThrow();
    expect(() => TenantPermissionCheckSchema.parse(samplePhase11CommercialState.permission_checks[0])).not.toThrow();
    expect(() => ManagedDatabaseStatusSchema.parse(samplePhase11CommercialState.managed_databases[0])).not.toThrow();
    expect(() => CustomerOnboardingChecklistSchema.parse(samplePhase11CommercialState.onboarding_checklists[0])).not.toThrow();
    expect(() => CommercialExportPackageSchema.parse(samplePhase11CommercialState.export_packages[0])).not.toThrow();
    expect(() => SupportIncidentSchema.parse(samplePhase11CommercialState.support_incidents[0])).not.toThrow();
    expect(() => Phase11CommercialReportSchema.parse(samplePhase11CommercialReport)).not.toThrow();
  });

  it("rejects raw face data, biometric data, ordinary user identity, phone, and device fingerprint fields", () => {
    expect(assertPhase11PrivacyBoundary({ nested: { raw_image: "unsafe" } })).toBe(false);
    expect(assertPhase11PrivacyBoundary({ face_landmarks: [] })).toBe(false);
    expect(assertPhase11PrivacyBoundary({ biometric_template: "unsafe" })).toBe(false);
    expect(assertPhase11PrivacyBoundary({ user_id: "user-1", phone: "123", device_fingerprint: "fp" })).toBe(false);
    expect(
      AdminAuthSessionSchema.safeParse({
        ...samplePhase11CommercialState.auth_sessions[0],
        raw_video: "unsafe"
      }).success
    ).toBe(false);
  });
});

describe("phase 11 migration, RBAC, and commercial snapshot access", () => {
  it("migrates phase 10 state into commercial tenants, managed database status, and PostgreSQL DDL", () => {
    const state = migratePhase10ToCommercialState(samplePhase10PilotState);
    const ddl = buildManagedPostgresSchemaPreview();

    expect(state.commercial_tenants).toHaveLength(2);
    expect(state.phase10_state.pilot_releases.length).toBe(samplePhase10PilotState.pilot_releases.length);
    expect(state.managed_databases.every((database) => database.restore_drill_passed)).toBe(true);
    expect(ddl).toContain("create table commercial_tenants");
    expect(ddl).toContain("create table admin_auth_sessions");
    expect(ddl).toContain("create table commercial_export_packages");
    expect(ddl).toContain("create table support_incidents");
  });

  it("enforces tenant-scoped RBAC and denies cross-tenant access", () => {
    expect(checkTenantPermission(samplePhase11CommercialState, "TEN-001", "ADM-004", "config:save_draft", "config_version", "CFG-101").allowed).toBe(false);
    expect(checkTenantPermission(samplePhase11CommercialState, "TEN-001", "ADM-001", "blocklist:block", "card_blocklist", "CARD-KB-001").allowed).toBe(true);
    expect(checkTenantPermission(samplePhase11CommercialState, "TEN-001", "ADM-001", "config:publish", "published_snapshot", "SNP-001").allowed).toBe(false);
    expect(checkTenantPermission(samplePhase11CommercialState, "TEN-001", "ADM-005", "config:rollback", "published_snapshot", "SNP-001").allowed).toBe(true);
    expect(checkTenantPermission(samplePhase11CommercialState, "TEN-001", "ADM-006", "metrics:read", "metrics", "CMP-001").allowed).toBe(false);
  });

  it("serves only active commercial-approved snapshots to H5", () => {
    const snapshot = getCommercialApprovedSnapshot(samplePhase11CommercialState, "TEN-001", "CMP-001");

    expect(snapshot?.campaign_id).toBe("CMP-001");

    const suspended = {
      ...samplePhase11CommercialState,
      commercial_tenants: samplePhase11CommercialState.commercial_tenants.map((tenant) =>
        tenant.tenant_id === "TEN-001" ? { ...tenant, commercial_status: "suspended" as const } : tenant
      )
    };

    expect(getCommercialApprovedSnapshot(suspended, "TEN-001", "CMP-001")).toBeNull();
  });
});

describe("phase 11 export, backup, and report", () => {
  it("builds privacy-clean commercial export packages from active snapshots", () => {
    const exportPackage = buildCommercialExportPackage(samplePhase11CommercialState, "TEN-001", "CMP-001");

    expect(exportPackage.snapshot_id).toMatch(/^SNP-\d{3}$/);
    expect(exportPackage.audit_export_id).toMatch(/^AUDIT-EXPORT-\d{3}$/);
    expect(assertPhase11PrivacyBoundary(exportPackage)).toBe(true);
    expect(JSON.stringify(exportPackage)).not.toContain("raw_image");
    expect(JSON.stringify(exportPackage)).not.toContain("user_id");
  });

  it("builds a go report when RBAC, migration, backup restore, privacy, and readiness pass", () => {
    const report = buildPhase11CommercialReport(samplePhase11CommercialState);

    expect(report.tenant_count).toBe(2);
    expect(report.active_customer_count).toBe(1);
    expect(report.migration_check_passed).toBe(true);
    expect(report.rbac_check_passed).toBe(true);
    expect(report.backup_restore_passed).toBe(true);
    expect(report.privacy_check_passed).toBe(true);
    expect(report.go_no_go_decision).toBe("go");
  });
});
