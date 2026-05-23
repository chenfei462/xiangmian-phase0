import { describe, expect, it } from "vitest";

import {
  AdminAccountSchema,
  AnonymousMetricsEventV02Schema,
  ConfigVersionV02Schema,
  PermissionPolicySchema,
  Phase9SaasReportSchema,
  PublishedConfigSnapshotSchema,
  SaasAuditLogSchema,
  TenantWorkspaceSchema
} from "../src/lib/phase9-contracts";
import {
  PHASE9_ADMIN_ACCOUNTS,
  PHASE9_PERMISSION_POLICIES,
  PHASE9_TENANTS,
  aggregatePhase9MetricsEvents,
  assertPhase9PrivacyBoundary,
  buildPhase9SaasReport,
  createAnonymousMetricsEventV02,
  createPhase9Repository,
  getPublishedCampaignCards,
  getPublishedSnapshotForCampaign,
  hashPayload,
  migratePhase8StoreToSaas,
  roleCanPerform,
  samplePhase9MetricsSnapshot,
  samplePhase9SaasReport,
  samplePhase9SaasState
} from "../src/lib/phase9-saas";

describe("phase 9 SaaS contracts", () => {
  it("validates tenant, account, permission, config version, audit, snapshot, metrics event, and report", () => {
    expect(() => TenantWorkspaceSchema.parse(PHASE9_TENANTS[0])).not.toThrow();
    expect(() => AdminAccountSchema.parse(PHASE9_ADMIN_ACCOUNTS[0])).not.toThrow();
    expect(() => PermissionPolicySchema.parse(PHASE9_PERMISSION_POLICIES[0])).not.toThrow();
    expect(() => ConfigVersionV02Schema.parse(samplePhase9SaasState.config_versions[0])).not.toThrow();
    expect(() => SaasAuditLogSchema.parse(samplePhase9SaasState.audit_logs[0])).not.toThrow();
    expect(() => PublishedConfigSnapshotSchema.parse(samplePhase9SaasState.published_snapshots[0])).not.toThrow();
    expect(() => AnonymousMetricsEventV02Schema.parse(samplePhase9SaasState.metrics_events[0])).not.toThrow();
    expect(() => Phase9SaasReportSchema.parse(samplePhase9SaasReport)).not.toThrow();
  });

  it("rejects raw face and ordinary user identity fields", () => {
    const event = samplePhase9SaasState.metrics_events[0];

    expect(AnonymousMetricsEventV02Schema.safeParse({ ...event, raw_image: "unsafe" }).success).toBe(false);
    expect(AnonymousMetricsEventV02Schema.safeParse({ ...event, user_id: "user-1" }).success).toBe(false);
    expect(SaasAuditLogSchema.safeParse({ ...samplePhase9SaasState.audit_logs[0], face_landmarks: [] }).success).toBe(false);
    expect(assertPhase9PrivacyBoundary({ nested: { biometric_template: "unsafe" } })).toBe(false);
  });
});

describe("phase 9 migration and repository", () => {
  it("migrates phase 8 admin config into internal and client-demo tenant drafts", () => {
    const state = migratePhase8StoreToSaas();

    expect(state.tenants.map((tenant) => tenant.tenant_id)).toEqual(expect.arrayContaining(["TEN-001", "TEN-002"]));
    expect(state.draft_stores).toHaveLength(2);
    expect(state.draft_stores[0].store.campaigns.map((campaign) => campaign.campaign_id)).toEqual(
      expect.arrayContaining(["CMP-001", "CMP-002"])
    );
    expect(state.audit_logs[0].after_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("publishes snapshots only through authorized roles and keeps drafts hidden from H5", () => {
    const repository = createPhase9Repository();

    expect(repository.exportSnapshot("TEN-001", "CMP-001")).toBeNull();
    expect(() => repository.publish("TEN-001", "ADM-002", "CMP-001", "Content cannot publish")).toThrow(/Permission/);

    repository.submitReview("TEN-001", "ADM-005", "Engineering review passed.");
    const snapshot = repository.publish("TEN-001", "ADM-005", "CMP-001", "Publish stable H5 snapshot.");

    expect(snapshot.snapshot_id).toMatch(/^SNP-\d{3}$/);
    expect(repository.exportSnapshot("TEN-001", "CMP-001")?.snapshot_id).toBe(snapshot.snapshot_id);
  });

  it("supports rollback to a previous published snapshot", () => {
    const repository = createPhase9Repository();

    repository.submitReview("TEN-001", "ADM-005", "Ready for first publish.");
    const first = repository.publish("TEN-001", "ADM-005", "CMP-001", "Publish first snapshot.");
    const cards = repository.loadDraft("TEN-001")!.campaigns[0].card_pool_ids;
    repository.blockCard("TEN-001", "ADM-001", cards[0], "Block one card before second publish.", "Phase 9 rollback test.");
    repository.submitReview("TEN-001", "ADM-005", "Ready for second publish.");
    const second = repository.publish("TEN-001", "ADM-005", "CMP-001", "Publish second snapshot.");
    const rollback = repository.rollback("TEN-001", "ADM-005", first.snapshot_id, "Rollback to first stable snapshot.");

    expect(second.snapshot_id).not.toBe(first.snapshot_id);
    expect(rollback.config_version_id).not.toBe(second.config_version_id);
    expect(repository.exportSnapshot("TEN-001", "CMP-001")?.snapshot_id).toBe(rollback.snapshot_id);
    expect(repository.getState().config_versions.find((version) => version.version_id === rollback.config_version_id)?.rollback_of).toBe(first.config_version_id);
  });

  it("blocks cards in a draft and removes them from the next published snapshot", () => {
    const repository = createPhase9Repository();
    const draft = repository.loadDraft("TEN-001")!;
    const campaignId = draft.campaigns[0].campaign_id;
    const cardId = draft.campaigns[0].card_pool_ids[0];

    repository.blockCard("TEN-001", "ADM-001", cardId, "Operational card takedown.", "Risk feedback drill.");
    repository.submitReview("TEN-001", "ADM-005", "Ready after blocklist drill.");
    const snapshot = repository.publish("TEN-001", "ADM-005", campaignId, "Publish blocklist snapshot.");
    const publishedCards = getPublishedCampaignCards(repository.getState(), "TEN-001", campaignId);

    expect(snapshot.blocklist.map((entry) => entry.card_id)).toContain(cardId);
    expect(publishedCards.map((card) => card.card_id)).not.toContain(cardId);
  });
});

describe("phase 9 permission, audit, and metrics", () => {
  it("enforces the role matrix", () => {
    expect(roleCanPerform("viewer", "config:save_draft")).toBe(false);
    expect(roleCanPerform("content", "config:save_draft")).toBe(true);
    expect(roleCanPerform("content", "config:publish")).toBe(false);
    expect(roleCanPerform("legal", "release_gate:review")).toBe(true);
    expect(roleCanPerform("compliance", "release_gate:review")).toBe(true);
    expect(roleCanPerform("operations", "blocklist:block")).toBe(true);
  });

  it("records audit logs with hashes instead of before/after payload bodies", () => {
    const repository = createPhase9Repository();
    const draft = repository.loadDraft("TEN-001")!;
    const cardId = draft.campaigns[0].card_pool_ids[0];

    repository.blockCard("TEN-001", "ADM-001", cardId, "Audit hash test.", "No raw payload in SaaS audit.");

    const audit = repository.getState().audit_logs[0];

    expect(audit.before_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(audit.after_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(JSON.stringify(audit)).not.toContain("safe_copy");
    expect(hashPayload({ b: 1, a: 2 })).toBe(hashPayload({ a: 2, b: 1 }));
  });

  it("aggregates anonymous metrics without identity fields", () => {
    const events = [
      createAnonymousMetricsEventV02({
        event_type: "campaign_viewed",
        campaign_id: "CMP-001",
        session_step: "entry",
        duration_bucket: "30_90s",
        timestamp: 1
      }),
      createAnonymousMetricsEventV02({
        event_type: "action_detected",
        campaign_id: "CMP-001",
        session_step: "action_task",
        trigger: "smile",
        card_group: "神气心相",
        duration_bucket: "30_90s",
        timestamp: 2
      }),
      createAnonymousMetricsEventV02({
        event_type: "card_drawn",
        campaign_id: "CMP-001",
        session_step: "result",
        trigger: "smile",
        card_group: "神气心相",
        duration_bucket: "30_90s",
        timestamp: 3
      }),
      createAnonymousMetricsEventV02({
        event_type: "poster_generated",
        campaign_id: "CMP-001",
        session_step: "result",
        trigger: "smile",
        card_group: "神气心相",
        duration_bucket: "30_90s",
        timestamp: 4
      })
    ];
    const metrics = aggregatePhase9MetricsEvents("CMP-001", events);

    expect(metrics.completion_rate).toBe(1);
    expect(metrics.action_success_rate).toBe(1);
    expect(metrics.poster_generation_rate).toBe(1);
    expect(metrics.share_click_rate).toBe(0);
    expect(samplePhase9MetricsSnapshot.completion_rate).toBe(1);
  });

  it("builds a go report for the seeded sample SaaS state", () => {
    const report = buildPhase9SaasReport(samplePhase9SaasState);

    expect(report.tenant_count).toBeGreaterThanOrEqual(2);
    expect(report.published_snapshot_count).toBeGreaterThanOrEqual(2);
    expect(report.permission_check_passed).toBe(true);
    expect(report.privacy_check_passed).toBe(true);
    expect(report.migration_check_passed).toBe(true);
    expect(report.go_no_go_decision).toBe("go");
    expect(getPublishedSnapshotForCampaign(samplePhase9SaasState, "TEN-001", "CMP-001")).not.toBeNull();
  });
});
