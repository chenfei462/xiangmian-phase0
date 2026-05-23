import { describe, expect, it } from "vitest";

import {
  Phase10PilotReportSchema,
  PilotMetricsSummarySchema,
  PilotReleaseSchema,
  PilotTenantSchema,
  PrivacyScanResultSchema,
  ProductionAuditPolicySchema,
  SaasEnvironmentSchema
} from "../src/lib/phase10-contracts";
import {
  PHASE10_AUDIT_POLICIES,
  PHASE10_ENVIRONMENTS,
  PHASE10_PILOT_TENANTS,
  buildPhase10PilotReport,
  buildPostgresSchemaPreview,
  createPilotMetricsSummary,
  getActivePilotSnapshot,
  migratePhase9ToPilotState,
  pausePilotRelease,
  rollbackPilotRelease,
  samplePhase10PilotReport,
  samplePhase10PilotState,
  scanPhase10Privacy
} from "../src/lib/phase10-pilot";
import { samplePhase9SaasState } from "../src/lib/phase9-saas";

describe("phase 10 controlled SaaS pilot contracts", () => {
  it("validates pilot tenant, environment, release, policy, privacy scan, metrics, and report schemas", () => {
    expect(() => PilotTenantSchema.parse(PHASE10_PILOT_TENANTS[0])).not.toThrow();
    expect(() => SaasEnvironmentSchema.parse(PHASE10_ENVIRONMENTS[0])).not.toThrow();
    expect(() => PilotReleaseSchema.parse(samplePhase10PilotState.pilot_releases[0])).not.toThrow();
    expect(() => ProductionAuditPolicySchema.parse(PHASE10_AUDIT_POLICIES[0])).not.toThrow();
    expect(() => PrivacyScanResultSchema.parse(samplePhase10PilotState.privacy_scans[0])).not.toThrow();
    expect(() => PilotMetricsSummarySchema.parse(samplePhase10PilotState.metrics_summaries[0])).not.toThrow();
    expect(() => Phase10PilotReportSchema.parse(samplePhase10PilotReport)).not.toThrow();
  });

  it("rejects raw face, keypoint, biometric, and ordinary user identity fields", () => {
    const scan = scanPhase10Privacy("PRIVACY-001", "metrics", {
      nested: {
        raw_image: "unsafe",
        face_landmarks: []
      },
      user_id: "user-1"
    });

    expect(scan.passed).toBe(false);
    expect(scan.forbidden_fields).toEqual(
      expect.arrayContaining(["$.nested.raw_image", "$.nested.face_landmarks", "$.user_id"])
    );
    expect(PrivacyScanResultSchema.safeParse({ ...scan, raw_video: "unsafe" }).success).toBe(false);
  });
});

describe("phase 10 migration, persistence boundary, and release control", () => {
  it("migrates phase 9 SaaS state into pilot tenants, releases, scans, and PostgreSQL-compatible DDL", () => {
    const state = migratePhase9ToPilotState(samplePhase9SaasState);
    const ddl = buildPostgresSchemaPreview();

    expect(state.pilot_tenants).toHaveLength(2);
    expect(state.pilot_releases.length).toBeGreaterThanOrEqual(3);
    expect(state.phase9_state.published_snapshots.length).toBe(samplePhase9SaasState.published_snapshots.length);
    expect(state.privacy_scans.every((scan) => scan.passed)).toBe(true);
    expect(ddl).toContain("create table pilot_tenants");
    expect(ddl).toContain("create table pilot_releases");
    expect(ddl).toContain("create table privacy_scan_results");
    expect(ddl).toContain("create table pilot_metrics_summaries");
  });

  it("only exposes pilot releases to H5 and treats paused releases as unavailable", () => {
    const active = getActivePilotSnapshot(samplePhase10PilotState, "TEN-001", "CMP-001");

    expect(active?.campaign_id).toBe("CMP-001");

    const paused = pausePilotRelease(
      samplePhase10PilotState,
      "REL-001",
      "ADM-005",
      "Pause pilot release during customer stop-switch drill."
    );

    expect(getActivePilotSnapshot(paused, "TEN-001", "CMP-001")).toBeNull();
    expect(paused.phase9_state.audit_logs[0].action_type).toBe("campaign:update");
  });

  it("rolls back to a previous stable snapshot and writes a hash-only audit record", () => {
    const active = getActivePilotSnapshot(samplePhase10PilotState, "TEN-001", "CMP-001");

    expect(active).not.toBeNull();

    const rolledBack = rollbackPilotRelease(
      samplePhase10PilotState,
      "REL-001",
      active!.snapshot_id,
      "ADM-005",
      "Rollback pilot release to the previous stable snapshot."
    );
    const release = rolledBack.pilot_releases.find((item) => item.release_id === "REL-001");
    const audit = rolledBack.phase9_state.audit_logs[0];

    expect(release?.status).toBe("rolled_back");
    expect(release?.rollback_snapshot_id).toBe(active!.snapshot_id);
    expect(audit.action_type).toBe("config:rollback");
    expect(audit.before_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(audit.after_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});

describe("phase 10 metrics and report", () => {
  it("summarizes pilot metrics from anonymous phase 9 events", () => {
    const summary = createPilotMetricsSummary("TEN-001", "CMP-001", samplePhase9SaasState);

    expect(summary.sample_size).toBeGreaterThan(0);
    expect(summary.completion_rate).toBe(1);
    expect(summary.manual_completion_rate).toBe(1);
    expect(summary.poster_generation_rate).toBe(1);
    expect(JSON.stringify(summary)).not.toContain("user_id");
  });

  it("builds a go report for the controlled pilot sample state", () => {
    const report = buildPhase10PilotReport(samplePhase10PilotState);

    expect(report.tenant_count).toBe(2);
    expect(report.pilot_release_count).toBeGreaterThanOrEqual(3);
    expect(report.rollback_drill_passed).toBe(true);
    expect(report.privacy_check_passed).toBe(true);
    expect(report.audit_check_passed).toBe(true);
    expect(report.go_no_go_decision).toBe("go");
  });
});
