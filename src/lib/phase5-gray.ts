import type { VisionEvent } from "./contracts";
import type { CardDraft } from "./knowledge-contracts";
import { getPhase2Handoff, getPublishableCardDrafts } from "./knowledge-query";
import type { AnonymousMvpEvent, FallbackReason } from "./phase4-contracts";
import {
  CardBlocklistSchema,
  GrayFeedbackRecordSchema,
  GrayMetricsReportSchema,
  GraySessionSummarySchema,
  GrayTestBatchSchema,
  Phase5GoNoGoSchema,
  type CardBlocklist,
  type GrayFeedbackRecord,
  type GrayMetricsReport,
  type GraySessionSummary,
  type GrayTestBatch,
  type Phase5GoNoGo,
  type TopFallbackReason
} from "./phase5-contracts";

const REVIEWED_AT = "2026-04-30T00:00:00.000Z";

export const DEFAULT_GRAY_TEST_BATCH: GrayTestBatch = GrayTestBatchSchema.parse({
  batch_id: "GRAY-001",
  version: "phase5-gray-v0.1",
  started_at: "2026-04-30T00:00:00.000Z",
  ended_at: null,
  target_sample_size: 50,
  allowed_surfaces: ["desktop_chrome", "android_chrome", "ios_safari"],
  goals: [
    "验证真实设备上的 90 秒闭环体验",
    "验证手动抽卡兜底可达",
    "收集分享意愿和内容安全反馈"
  ],
  go_no_go_thresholds: {
    completion_rate: 0.7,
    manual_completion_rate: 1,
    action_success_rate: 0.9,
    result_reach_rate: 0.7,
    negative_feedback_rate: 0
  }
});

export const sampleGraySessions: GraySessionSummary[] = [
  {
    session_id: "GS-001",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    completed: true,
    manual_mode_used: false,
    result_reached: true,
    duration_ms: 62000,
    fallback_reasons: [],
    event_count: 6
  },
  {
    session_id: "GS-002",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    completed: true,
    manual_mode_used: true,
    result_reached: true,
    duration_ms: 54000,
    fallback_reasons: [],
    event_count: 4
  },
  {
    session_id: "GS-003",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    completed: false,
    manual_mode_used: false,
    result_reached: false,
    duration_ms: 90000,
    fallback_reasons: ["action_timeout"],
    event_count: 3
  },
  {
    session_id: "GS-004",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    completed: true,
    manual_mode_used: false,
    result_reached: true,
    duration_ms: 68000,
    fallback_reasons: [],
    event_count: 5
  }
].map((session) => GraySessionSummarySchema.parse(session));

export const sampleGrayFeedbackRecords: GrayFeedbackRecord[] = [
  {
    feedback_id: "FB-001",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    device_type: "desktop",
    browser: "Desktop Chrome",
    completion_rating: 5,
    copy_safety_rating: 5,
    share_intent: "yes",
    issue_tags: [],
    notes: "流程清楚，结果页能理解。"
  },
  {
    feedback_id: "FB-002",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    device_type: "android",
    browser: "Android Chrome",
    completion_rating: 4,
    copy_safety_rating: 5,
    share_intent: "maybe",
    issue_tags: [],
    notes: "希望后续有海报。"
  },
  {
    feedback_id: "FB-003",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    device_type: "ios",
    browser: "iOS Safari",
    completion_rating: 4,
    copy_safety_rating: 4,
    share_intent: "yes",
    issue_tags: [],
    notes: "授权说明可以接受。"
  },
  {
    feedback_id: "FB-004",
    batch_id: DEFAULT_GRAY_TEST_BATCH.batch_id,
    device_type: "desktop",
    browser: "Desktop Chrome",
    completion_rating: 3,
    copy_safety_rating: 4,
    share_intent: "no",
    issue_tags: [],
    notes: "动作触发需要更明显提示。"
  }
].map((feedback) => GrayFeedbackRecordSchema.parse(feedback));

function roundRate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(2));
}

function isNegativeFeedback(feedback: GrayFeedbackRecord): boolean {
  return (
    feedback.copy_safety_rating <= 2 ||
    feedback.issue_tags.some((tag) => ["copy_risk", "privacy_risk", "offensive"].includes(tag))
  );
}

export function createGraySessionSummary(input: {
  session_id: string;
  batch_id: string;
  started_at: number;
  ended_at: number;
  events: AnonymousMvpEvent[];
}): GraySessionSummary {
  const fallbackReasons = input.events
    .map((event) => event.fallback_reason)
    .filter((reason): reason is FallbackReason => Boolean(reason));
  const manualModeUsed = input.events.some((event) => event.event_type === "manual_mode_selected");
  const resultReached = input.events.some((event) => event.event_type === "card_drawn");

  return GraySessionSummarySchema.parse({
    session_id: input.session_id,
    batch_id: input.batch_id,
    completed: resultReached,
    manual_mode_used: manualModeUsed,
    result_reached: resultReached,
    duration_ms: Math.max(0, input.ended_at - input.started_at),
    fallback_reasons: fallbackReasons,
    event_count: input.events.length
  });
}

export function buildGrayMetricsReport(
  sessions: GraySessionSummary[],
  feedbackRecords: GrayFeedbackRecord[]
): GrayMetricsReport {
  const manualSessions = sessions.filter((session) => session.manual_mode_used);
  const fallbackCounts = new Map<FallbackReason, number>();

  for (const session of sessions) {
    for (const reason of session.fallback_reasons) {
      fallbackCounts.set(reason, (fallbackCounts.get(reason) ?? 0) + 1);
    }
  }

  const topFallbackReasons: TopFallbackReason[] = [...fallbackCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((left, right) => right.count - left.count || left.reason.localeCompare(right.reason));
  const actionTimeouts = sessions.filter((session) =>
    session.fallback_reasons.includes("action_timeout")
  ).length;

  return GrayMetricsReportSchema.parse({
    sample_size: sessions.length,
    completion_rate: roundRate(sessions.filter((session) => session.completed).length, sessions.length),
    manual_completion_rate: roundRate(
      manualSessions.filter((session) => session.completed).length,
      manualSessions.length
    ),
    action_success_rate: roundRate(sessions.length - actionTimeouts, sessions.length),
    result_reach_rate: roundRate(sessions.filter((session) => session.result_reached).length, sessions.length),
    share_intent_rate: roundRate(
      feedbackRecords.filter((feedback) => feedback.share_intent === "yes").length,
      feedbackRecords.length
    ),
    negative_feedback_rate: roundRate(
      feedbackRecords.filter((feedback) => isNegativeFeedback(feedback)).length,
      feedbackRecords.length
    ),
    top_fallback_reasons: topFallbackReasons
  });
}

export function buildCardBlocklist(cardIds: string[], reason: string): CardBlocklist[] {
  return cardIds.map((cardId) =>
    CardBlocklistSchema.parse({
      card_id: cardId,
      reason,
      blocked_at: REVIEWED_AT,
      reviewer_role: "content",
      notes: "Phase 5 gray-test blocklist drill; review before reactivation."
    })
  );
}

export function filterBlockedCards(cards: CardDraft[], blocklist: CardBlocklist[]): CardDraft[] {
  const blockedIds = new Set(blocklist.map((entry) => entry.card_id));

  return cards.filter((card) => !blockedIds.has(card.card_id));
}

export function selectGrayCardForEvent(
  event: VisionEvent,
  blocklist: CardBlocklist[]
): CardDraft | null {
  const candidates = filterBlockedCards(getPhase2Handoff().cards_by_trigger[event.type], blocklist);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.abs(event.timestamp) % candidates.length];
}

export function createPhase5GoNoGo(
  report: GrayMetricsReport,
  batch: GrayTestBatch
): Phase5GoNoGo {
  const thresholds = batch.go_no_go_thresholds;
  const blockingIssues: string[] = [];

  if (report.completion_rate < thresholds.completion_rate) {
    blockingIssues.push("完成率低于灰度门槛");
  }
  if (report.manual_completion_rate < thresholds.manual_completion_rate) {
    blockingIssues.push("手动抽卡完成率低于 100%");
  }
  if (report.action_success_rate < thresholds.action_success_rate) {
    blockingIssues.push("明亮环境动作成功率低于 90% 目标");
  }
  if (report.result_reach_rate < thresholds.result_reach_rate) {
    blockingIssues.push("结果页到达率低于灰度门槛");
  }
  if (report.negative_feedback_rate > thresholds.negative_feedback_rate) {
    blockingIssues.push("出现内容安全或隐私负面反馈");
  }

  return Phase5GoNoGoSchema.parse({
    decision: blockingIssues.length === 0 ? "go" : "hold",
    blocking_issues: blockingIssues,
    required_fixes: blockingIssues.map((issue) => `修复：${issue}`),
    phase6_recommendation:
      blockingIssues.length === 0
        ? "进入发布准备，保留人工法务复核门槛。"
        : "暂停进入公开发布，先回到第4阶段修复阻断问题。"
  });
}

export const sampleGrayMetricsReport = buildGrayMetricsReport(
  sampleGraySessions,
  sampleGrayFeedbackRecords
);
export const samplePhase5GoNoGo = createPhase5GoNoGo(sampleGrayMetricsReport, DEFAULT_GRAY_TEST_BATCH);

export const grayPublishableCandidateCount = filterBlockedCards(
  getPublishableCardDrafts(),
  []
).length;
