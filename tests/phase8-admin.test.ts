import { describe, expect, it } from "vitest";

import {
  AdminActionSchema,
  AdminActorSchema,
  AdminConfigStoreSchema,
  AdminDraftChangeSchema,
  AdminMetricsSnapshotSchema,
  AdminUserRoleSchema,
  ConfigVersionSchema,
  Phase8AdminReportSchema
} from "../src/lib/phase8-contracts";
import {
  PHASE8_CONFIG_VERSION,
  PHASE8_DRAFT_CHANGE,
  addCardToAdminBlocklist,
  assertPhase8PrivacyBoundary,
  buildPhase8AdminReport,
  createPhase8AdminConfigStore,
  exportAdminConfigStore,
  getAdminCampaignCards,
  importAdminConfigStore,
  publishAdminConfigVersion,
  removeCardFromAdminBlocklist,
  samplePhase8AdminReport,
  samplePhase8AdminStore,
  updateAdminCampaignStatus,
  updateAdminReleaseGate
} from "../src/lib/phase8-admin";

describe("phase 8 admin contracts", () => {
  it("validates admin role, actor, config version, store, audit, draft, metrics, and report", () => {
    expect(() => AdminUserRoleSchema.parse("operations")).not.toThrow();
    expect(() =>
      AdminActorSchema.parse({
        actor_id: "ADM-001",
        role: "operations",
        display_name: "Local operator"
      })
    ).not.toThrow();
    expect(() => ConfigVersionSchema.parse(PHASE8_CONFIG_VERSION)).not.toThrow();
    expect(() => AdminConfigStoreSchema.parse(samplePhase8AdminStore)).not.toThrow();
    expect(() => AdminActionSchema.parse(samplePhase8AdminStore.audit_logs[0])).not.toThrow();
    expect(() => AdminDraftChangeSchema.parse(PHASE8_DRAFT_CHANGE)).not.toThrow();
    expect(() => AdminMetricsSnapshotSchema.parse(samplePhase8AdminStore.metrics_fixtures[0])).not.toThrow();
    expect(() => Phase8AdminReportSchema.parse(samplePhase8AdminReport)).not.toThrow();
  });

  it("seeds the phase 7 registry into a versioned admin config store", () => {
    const store = createPhase8AdminConfigStore();

    expect(store.themes.length).toBeGreaterThanOrEqual(2);
    expect(store.campaigns.map((campaign) => campaign.campaign_id)).toEqual(
      expect.arrayContaining(["CMP-001", "CMP-002"])
    );
    expect(store.scenarios.length).toBeGreaterThanOrEqual(2);
    expect(store.release_gates.every((gate) => gate.status === "pass")).toBe(true);
    expect(store.audit_logs[0].action_type).toBe("import");
  });

  it("exports and imports admin config without changing the data shape", () => {
    const payload = exportAdminConfigStore(samplePhase8AdminStore);
    const imported = importAdminConfigStore(payload);

    expect(imported).toEqual(samplePhase8AdminStore);
    expect(payload).toContain("release_gates");
    expect(payload).toContain("metrics_fixtures");
  });
});

describe("phase 8 admin workflows", () => {
  it("blocks and unblocks cards with audit records and affects campaign candidates", () => {
    const store = createPhase8AdminConfigStore();
    const campaignId = store.campaigns[0].campaign_id;
    const firstCard = getAdminCampaignCards(store, campaignId)[0];

    expect(firstCard).toBeDefined();

    const blocked = addCardToAdminBlocklist(
      store,
      firstCard.card_id,
      "operations",
      "Phase 8 test block",
      "Do not show this card during the local admin drill."
    );

    expect(blocked.card_blocklist).toHaveLength(1);
    expect(blocked.audit_logs[0].action_type).toBe("block");
    expect(getAdminCampaignCards(blocked, campaignId).map((card) => card.card_id)).not.toContain(firstCard.card_id);

    const unblocked = removeCardFromAdminBlocklist(
      blocked,
      firstCard.card_id,
      "operations",
      "Phase 8 test unblock"
    );

    expect(unblocked.card_blocklist).toHaveLength(0);
    expect(unblocked.audit_logs[0].action_type).toBe("unblock");
    expect(getAdminCampaignCards(unblocked, campaignId).map((card) => card.card_id)).toContain(firstCard.card_id);
  });

  it("updates release gates and campaign status while recording audit history", () => {
    const store = createPhase8AdminConfigStore();
    const held = updateAdminReleaseGate(
      store,
      "GATE-004",
      "blocked",
      "legal",
      "Legal hold for release gate drill.",
      "Pending final legal review."
    );

    expect(held.release_gates.find((gate) => gate.gate_id === "GATE-004")?.status).toBe("blocked");
    expect(held.audit_logs[0].target_type).toBe("release_gate");

    const paused = updateAdminCampaignStatus(
      held,
      held.campaigns[0].campaign_id,
      "paused",
      "operations",
      "Pause campaign during admin drill."
    );

    expect(paused.campaigns[0].release_status).toBe("paused");
    expect(paused.audit_logs[0].target_type).toBe("campaign");
  });

  it("publishes only when privacy checks and release gates pass", () => {
    const store = createPhase8AdminConfigStore();
    const published = publishAdminConfigVersion(store, PHASE8_CONFIG_VERSION, "operations");

    expect(published.status).toBe("published");
    expect(published.published_at).not.toBeNull();

    const blocked = updateAdminReleaseGate(
      store,
      "GATE-002",
      "blocked",
      "content",
      "Content review hold.",
      "Unsafe copy review is not complete."
    );

    expect(() => publishAdminConfigVersion(blocked, PHASE8_CONFIG_VERSION, "operations")).toThrow(
      /release gate/
    );
  });

  it("builds a go admin report for the seeded local config", () => {
    const report = buildPhase8AdminReport(samplePhase8AdminStore, PHASE8_CONFIG_VERSION);

    expect(report.config_version_id).toBe("CFG-001");
    expect(report.editable_surfaces).toEqual(expect.arrayContaining(["campaign", "card_blocklist", "release_gate"]));
    expect(report.privacy_check_passed).toBe(true);
    expect(report.published_campaign_count).toBeGreaterThanOrEqual(2);
    expect(report.go_no_go_decision).toBe("go");
  });
});

describe("phase 8 privacy guardrails", () => {
  it("rejects forbidden top-level fields through strict schemas", () => {
    expect(AdminConfigStoreSchema.safeParse({ ...samplePhase8AdminStore, raw_image: "unsafe" }).success).toBe(false);
    expect(AdminMetricsSnapshotSchema.safeParse({
      ...samplePhase8AdminStore.metrics_fixtures[0],
      user_id: "user-1"
    }).success).toBe(false);
  });

  it("detects forbidden nested payloads before export or publish", () => {
    const unsafeStore = {
      ...samplePhase8AdminStore,
      audit_logs: [
        {
          ...samplePhase8AdminStore.audit_logs[0],
          before: {
            face_landmarks: [1, 2, 3]
          }
        }
      ]
    };

    expect(assertPhase8PrivacyBoundary(unsafeStore)).toBe(false);
    expect(() => exportAdminConfigStore(unsafeStore)).toThrow(/privacy/);
    expect(() => publishAdminConfigVersion(unsafeStore, PHASE8_CONFIG_VERSION, "operations")).toThrow(/privacy/);
  });
});
