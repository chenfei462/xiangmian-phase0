import { describe, expect, it } from "vitest";

import { VISION_EVENT_TYPES } from "../src/lib/contracts";
import {
  AnonymousMvpEventSchema,
  ContentAuditRecordSchema,
  DisclaimerPolicySchema,
  FALLBACK_REASONS,
  FallbackReasonSchema,
  Phase4QaReportSchema,
  SafetyScanReportSchema
} from "../src/lib/phase4-contracts";
import {
  createAnonymousMvpEvent,
  createPhase4QaReport,
  DISCLAIMER_POLICIES,
  getFallbackMessage
} from "../src/lib/phase4-governance";
import {
  buildSafetyScanReport,
  createContentAuditRecords,
  scanPhase4RiskClaims
} from "../src/lib/phase4-safety";
import { getPublishableCardDrafts } from "../src/lib/knowledge-query";

describe("phase 4 contracts", () => {
  it("validates content audit, safety report, disclaimer, fallback, anonymous event, and QA report", () => {
    expect(() =>
      ContentAuditRecordSchema.parse({
        target_type: "card",
        target_id: "CARD-KB-001",
        risk_hits: [],
        decision: "pass",
        reviewer_role: "compliance",
        notes: "Phase 4 automated scan passed; legal review pending.",
        reviewed_at: "2026-04-30T00:00:00.000Z"
      })
    ).not.toThrow();
    expect(() =>
      SafetyScanReportSchema.parse({
        total_cards: 300,
        passed_count: 300,
        blocked_count: 0,
        rewrite_count: 0,
        unsafe_ids: [],
        risk_hits_by_claim: {}
      })
    ).not.toThrow();
    expect(() => DisclaimerPolicySchema.parse(DISCLAIMER_POLICIES.result)).not.toThrow();
    expect(() => FallbackReasonSchema.parse("action_timeout")).not.toThrow();
    expect(() =>
      Phase4QaReportSchema.parse({
        content_audit_passed: true,
        browser_compatibility: ["Desktop Chrome", "Android Chrome", "iOS Safari"],
        fallback_paths_covered: [...FALLBACK_REASONS],
        performance_notes: "Manual draw and result path stay responsive.",
        go_no_go: "go"
      })
    ).not.toThrow();
  });

  it("rejects anonymous events that contain face, identity, or raw media fields", () => {
    const event = createAnonymousMvpEvent({
      event_type: "fallback_triggered",
      session_step: "fallback",
      fallback_reason: "camera_denied",
      timestamp: 1770000000000
    });

    expect(() => AnonymousMvpEventSchema.parse(event)).not.toThrow();
    expect(
      AnonymousMvpEventSchema.safeParse({
        ...event,
        raw_image: "data:image/png;base64,unsafe"
      }).success
    ).toBe(false);
    expect(
      AnonymousMvpEventSchema.safeParse({
        ...event,
        face_landmarks: [{ x: 0.1, y: 0.2 }]
      }).success
    ).toBe(false);
    expect(
      AnonymousMvpEventSchema.safeParse({
        ...event,
        user_id: "person-1"
      }).success
    ).toBe(false);
  });
});

describe("phase 4 safety scan", () => {
  it("flags expanded prohibited claims before user-visible copy can ship", () => {
    const hits = scanPhase4RiskClaims(
      "本卡不能暗示命中注定、预测准确、寿命、怀孕、生育、克夫、贫贱、犯罪倾向、性取向。"
    );

    expect(hits).toEqual(
      expect.arrayContaining([
        "命中注定",
        "预测准确",
        "寿命",
        "怀孕",
        "生育",
        "克夫",
        "贫贱",
        "犯罪倾向",
        "性取向"
      ])
    );
  });

  it("reports zero unsafe publishable cards for Phase 4 gray readiness", () => {
    const report = buildSafetyScanReport(getPublishableCardDrafts());

    expect(() => SafetyScanReportSchema.parse(report)).not.toThrow();
    expect(report.total_cards).toBeGreaterThanOrEqual(300);
    expect(report.passed_count).toBe(report.total_cards);
    expect(report.blocked_count).toBe(0);
    expect(report.rewrite_count).toBe(0);
    expect(report.unsafe_ids).toEqual([]);
  });

  it("creates audit records for every publishable card candidate", () => {
    const cards = getPublishableCardDrafts();
    const records = createContentAuditRecords(cards, "2026-04-30T00:00:00.000Z");

    expect(records).toHaveLength(cards.length);
    expect(records.every((record) => record.decision === "pass")).toBe(true);
    expect(records.every((record) => record.risk_hits.length === 0)).toBe(true);
  });
});

describe("phase 4 disclaimer, fallback, and QA policy", () => {
  it("requires consistent disclaimers on all key user surfaces", () => {
    const surfaces = ["entry", "consent", "result", "fallback", "exit", "share_placeholder"] as const;

    for (const surface of surfaces) {
      const policy = DISCLAIMER_POLICIES[surface];

      expect(policy.required).toBe(true);
      expect(policy.copy).toContain("传统文化娱乐");
      expect(policy.copy).toContain("不能作为");
      expect(policy.copy).not.toContain("AI 算命");
      expect(policy.copy).not.toContain("预测准确");
    }
  });

  it("provides manual-draw fallback messages for every planned failure reason", () => {
    for (const reason of FALLBACK_REASONS) {
      const message = getFallbackMessage(reason);

      expect(message).toContain("手动抽卡");
      expect(message.length).toBeGreaterThan(12);
    }
  });

  it("builds a Phase 4 QA report with all fallback paths covered", () => {
    const report = createPhase4QaReport({
      content_audit_passed: true,
      browser_compatibility: ["Desktop Chrome", "Android Chrome", "iOS Safari"],
      performance_notes: "首屏、手动抽卡、结果页和退出清理已纳入灰度前检查。"
    });

    expect(() => Phase4QaReportSchema.parse(report)).not.toThrow();
    expect(report.go_no_go).toBe("go");
    expect(report.fallback_paths_covered).toEqual([...FALLBACK_REASONS]);
  });

  it("allows anonymous event triggers for every vision action without raw data", () => {
    for (const trigger of VISION_EVENT_TYPES) {
      const event = createAnonymousMvpEvent({
        event_type: "action_detected",
        session_step: "action_task",
        trigger,
        card_group: "神气心相",
        timestamp: 1770000000000
      });

      expect(() => AnonymousMvpEventSchema.parse(event)).not.toThrow();
    }
  });
});
