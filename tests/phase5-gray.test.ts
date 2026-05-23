import { describe, expect, it } from "vitest";

import type { VisionEvent } from "../src/lib/contracts";
import { getPublishableCardDrafts } from "../src/lib/knowledge-query";
import {
  CardBlocklistSchema,
  GrayFeedbackRecordSchema,
  GrayMetricsReportSchema,
  GraySessionSummarySchema,
  GrayTestBatchSchema,
  Phase5GoNoGoSchema
} from "../src/lib/phase5-contracts";
import {
  DEFAULT_GRAY_TEST_BATCH,
  buildCardBlocklist,
  buildGrayMetricsReport,
  createGraySessionSummary,
  createPhase5GoNoGo,
  filterBlockedCards,
  sampleGrayFeedbackRecords,
  sampleGraySessions,
  selectGrayCardForEvent
} from "../src/lib/phase5-gray";

const timestamp = 1770000000000;

function event(type: VisionEvent["type"], seed = timestamp): VisionEvent {
  return {
    type,
    confidence: 0.9,
    quality_score: 0.86,
    timestamp: seed
  };
}

describe("phase 5 gray-test contracts", () => {
  it("validates gray batch, session summary, feedback, metrics, blocklist, and go/no-go records", () => {
    expect(() => GrayTestBatchSchema.parse(DEFAULT_GRAY_TEST_BATCH)).not.toThrow();
    expect(() => GraySessionSummarySchema.parse(sampleGraySessions[0])).not.toThrow();
    expect(() => GrayFeedbackRecordSchema.parse(sampleGrayFeedbackRecords[0])).not.toThrow();
    expect(() =>
      GrayMetricsReportSchema.parse({
        sample_size: 4,
        completion_rate: 0.75,
        manual_completion_rate: 1,
        action_success_rate: 0.75,
        result_reach_rate: 0.75,
        share_intent_rate: 0.5,
        negative_feedback_rate: 0,
        top_fallback_reasons: [{ reason: "action_timeout", count: 1 }]
      })
    ).not.toThrow();
    expect(() =>
      CardBlocklistSchema.parse({
        card_id: "CARD-KB-001",
        reason: "灰度反馈命中文案风险",
        blocked_at: "2026-04-30T00:00:00.000Z",
        reviewer_role: "content",
        notes: "临时下线，等待复核。"
      })
    ).not.toThrow();
    expect(() =>
      Phase5GoNoGoSchema.parse({
        decision: "go",
        blocking_issues: [],
        required_fixes: [],
        phase6_recommendation: "进入发布准备，保留人工法务复核门槛。"
      })
    ).not.toThrow();
  });

  it("rejects gray feedback that contains identity or biometric fields", () => {
    const feedback = sampleGrayFeedbackRecords[0];

    expect(GrayFeedbackRecordSchema.safeParse({ ...feedback, user_id: "u-1" }).success).toBe(false);
    expect(GrayFeedbackRecordSchema.safeParse({ ...feedback, phone: "13800000000" }).success).toBe(false);
    expect(GrayFeedbackRecordSchema.safeParse({ ...feedback, face_landmarks: [] }).success).toBe(false);
    expect(GrayFeedbackRecordSchema.safeParse({ ...feedback, raw_image: "data:image/png;base64,unsafe" }).success).toBe(false);
  });
});

describe("phase 5 metrics and go/no-go", () => {
  it("creates session summaries from anonymous events without storing raw face data", () => {
    const summary = createGraySessionSummary({
      session_id: "GS-999",
      batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
      started_at: 1000,
      ended_at: 71000,
      events: [
        { event_type: "session_started", session_step: "entry", timestamp: 1000 },
        { event_type: "manual_mode_selected", session_step: "drawing", trigger: "manual_draw", timestamp: 2000 },
        { event_type: "card_drawn", session_step: "result", trigger: "manual_draw", timestamp: 70000 }
      ]
    });

    expect(summary.completed).toBe(true);
    expect(summary.manual_mode_used).toBe(true);
    expect(summary.result_reached).toBe(true);
    expect(summary.duration_ms).toBe(70000);
    expect(summary.event_count).toBe(3);
  });

  it("computes gray metrics from sessions and feedback accurately", () => {
    const report = buildGrayMetricsReport(sampleGraySessions, sampleGrayFeedbackRecords);

    expect(report.sample_size).toBe(4);
    expect(report.completion_rate).toBe(0.75);
    expect(report.manual_completion_rate).toBe(1);
    expect(report.action_success_rate).toBe(0.75);
    expect(report.result_reach_rate).toBe(0.75);
    expect(report.share_intent_rate).toBe(0.5);
    expect(report.negative_feedback_rate).toBe(0);
    expect(report.top_fallback_reasons).toEqual([{ reason: "action_timeout", count: 1 }]);
  });

  it("produces hold when completion or safety metrics miss gray thresholds", () => {
    const passing = buildGrayMetricsReport(sampleGraySessions, sampleGrayFeedbackRecords);
    const goReady = {
      ...passing,
      action_success_rate: DEFAULT_GRAY_TEST_BATCH.go_no_go_thresholds.action_success_rate
    };
    const hold = buildGrayMetricsReport(
      sampleGraySessions.map((session) => ({ ...session, completed: false, result_reached: false })),
      sampleGrayFeedbackRecords.map((feedback) => ({ ...feedback, copy_safety_rating: 2, issue_tags: ["copy_risk"] }))
    );

    expect(createPhase5GoNoGo(goReady, DEFAULT_GRAY_TEST_BATCH).decision).toBe("go");
    expect(createPhase5GoNoGo(passing, DEFAULT_GRAY_TEST_BATCH).decision).toBe("hold");
    expect(createPhase5GoNoGo(hold, DEFAULT_GRAY_TEST_BATCH).decision).toBe("hold");
    expect(createPhase5GoNoGo(hold, DEFAULT_GRAY_TEST_BATCH).blocking_issues.length).toBeGreaterThan(0);
  });
});

describe("phase 5 card blocklist drill", () => {
  it("filters blocked cards out of gray candidate pools", () => {
    const cards = getPublishableCardDrafts().slice(0, 3);
    const blocklist = buildCardBlocklist([cards[0].card_id], "灰度反馈命中文案风险");
    const filtered = filterBlockedCards(cards, blocklist);

    expect(filtered.map((card) => card.card_id)).not.toContain(cards[0].card_id);
    expect(filtered).toHaveLength(2);
  });

  it("never selects a blocked card for a gray draw", () => {
    const firstCandidate = selectGrayCardForEvent(event("manual_draw", timestamp), []);

    expect(firstCandidate).not.toBeNull();

    const blocklist = buildCardBlocklist([firstCandidate!.card_id], "灰度演练下线");
    const selected = selectGrayCardForEvent(event("manual_draw", timestamp), blocklist);

    expect(selected).not.toBeNull();
    expect(selected?.card_id).not.toBe(firstCandidate?.card_id);
  });

  it("returns null when every candidate for the trigger is blocked", () => {
    const allManualCards = getPublishableCardDrafts().filter((card) =>
      card.interaction_triggers.includes("manual_draw")
    );
    const blocklist = buildCardBlocklist(
      allManualCards.map((card) => card.card_id),
      "灰度演练全部下线"
    );

    expect(selectGrayCardForEvent(event("manual_draw"), blocklist)).toBeNull();
  });
});
