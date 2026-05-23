import type { VisionEvent, VisionEventType } from "./contracts";
import type { CardDraft, CardGroup } from "./knowledge-contracts";
import { getPublishableCardDrafts } from "./knowledge-query";
import type { ResultTone } from "./mvp-contracts";
import type { FallbackReason } from "./phase4-contracts";
import type { CardBlocklist, GraySessionSummary } from "./phase5-contracts";
import {
  CampaignConfigSchema,
  Phase6LaunchReportSchema,
  PosterRenderRequestSchema,
  PublicAnonymousEventSchema,
  ReleaseGateSchema,
  ThemePackSchema,
  type CampaignConfig,
  type Phase6LaunchReport,
  type PosterRenderRequest,
  type PublicAnonymousEvent,
  type PublicDurationBucket,
  type ReleaseGate,
  type ThemePack
} from "./phase6-contracts";

const REVIEWED_AT = "2026-04-30T00:00:00.000Z";
const QR_TARGET = "https://example.com/qiancheng";
const RELEASE_DISCLAIMER =
  "本体验为传统文化娱乐互动，不能作为性格、命运、健康、婚恋、职业、财务或任何重要事项的判断依据。";
const PHASE6_FORBIDDEN_TERMS = [
  "必成",
  "升职",
  "发财",
  "贵人",
  "命定前程",
  "财富预测",
  "职业成败",
  "准确预测",
  "命中注定"
] as const;

const FUTURE_MIRROR_GROUPS: CardGroup[] = ["三停流转", "五官守护", "神气心相", "手动问镜"];
const ALL_TRIGGERS: VisionEventType[] = [
  "look_stable",
  "blink",
  "smile",
  "brow_up",
  "mouth_open",
  "head_turn",
  "eyes_closed",
  "manual_draw"
];

export type PosterRenderModel = {
  campaign_id: string;
  theme_name: string;
  template_id: string;
  card_id: string;
  card_title: string;
  result_tone: ResultTone;
  safe_copy: string;
  action_suggestion: string;
  qr_target: string;
  disclaimer: string;
  includes_raw_face: false;
};

export const FUTURE_MIRROR_THEME_PACK: ThemePack = ThemePackSchema.parse({
  theme_id: "THEME-QIANCHENG-001",
  name: "前程镜",
  safe_positioning: "毕业季/求职季传统文化互动卡牌，只提供目标拆解、表达沟通、节奏管理和复盘行动建议。",
  copy_tone: "清晰、克制、行动导向，不承诺职业结果。",
  allowed_card_groups: FUTURE_MIRROR_GROUPS,
  result_templates: [
    "本次前程镜抽到 {card_title}，适合把目标拆成可执行的小步。",
    "今日行动建议：{action_suggestion}",
    RELEASE_DISCLAIMER
  ],
  poster_template_id: "POSTER-QIANCHENG-001",
  disclaimer_policy_id: "DISCLAIMER-PUBLIC-001",
  review_status: "approved"
});

function hasPhase6ForbiddenClaim(card: CardDraft): boolean {
  const copy = `${card.safe_title}${card.safe_copy}${card.action_suggestion}`;

  return PHASE6_FORBIDDEN_TERMS.some((term) => copy.includes(term));
}

function phase6CardPoolIds(): string[] {
  return getPublishableCardDrafts()
    .filter((card) => FUTURE_MIRROR_THEME_PACK.allowed_card_groups.includes(card.card_group))
    .filter((card) => !hasPhase6ForbiddenClaim(card))
    .map((card) => card.card_id);
}

export const DEFAULT_PHASE6_CAMPAIGN: CampaignConfig = CampaignConfigSchema.parse({
  campaign_id: "CMP-001",
  theme_id: FUTURE_MIRROR_THEME_PACK.theme_id,
  surface: "web_h5",
  version: "phase6-launch-v0.1",
  started_at: REVIEWED_AT,
  ended_at: null,
  enabled_triggers: ALL_TRIGGERS,
  card_pool_ids: phase6CardPoolIds(),
  blocked_card_ids: [],
  feedback_url: "https://example.com/qiancheng/feedback",
  metrics_targets: {
    completion_rate: 0.7,
    manual_completion_rate: 1,
    action_success_rate: 0.9,
    poster_generation_rate: 0.35,
    share_click_rate: 0.1,
    negative_feedback_count: 0
  },
  release_status: "ready"
});

export const PHASE6_RELEASE_GATES: ReleaseGate[] = ReleaseGateSchema.array().parse([
  {
    gate_id: "GATE-001",
    item: "Phase 5 Go/No-Go blockers cleared",
    owner_role: "product",
    status: "pass",
    evidence: "Release metrics use the public launch target set and keep manual fallback at 100%.",
    blocker_reason: null,
    reviewed_at: REVIEWED_AT
  },
  {
    gate_id: "GATE-002",
    item: "Future mirror theme copy reviewed",
    owner_role: "content",
    status: "pass",
    evidence: "Theme pack excludes career outcome, wealth, fate and guaranteed-success claims.",
    blocker_reason: null,
    reviewed_at: REVIEWED_AT
  },
  {
    gate_id: "GATE-003",
    item: "Privacy and legal wording approved",
    owner_role: "legal",
    status: "pass",
    evidence: "Public event and poster schemas reject raw face data and identity fields.",
    blocker_reason: null,
    reviewed_at: REVIEWED_AT
  },
  {
    gate_id: "GATE-004",
    item: "Card blocklist and rollback drill completed",
    owner_role: "operations",
    status: "pass",
    evidence: "Blocked cards are removed before launch selection and poster rendering.",
    blocker_reason: null,
    reviewed_at: REVIEWED_AT
  }
]);

function roundRate(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Number((numerator / denominator).toFixed(2));
}

function durationBucket(durationMs: number): PublicDurationBucket {
  if (durationMs < 30_000) {
    return "under_30s";
  }

  return durationMs <= 90_000 ? "30_90s" : "over_90s";
}

function cardIsBlocked(card: CardDraft, blocklist: CardBlocklist[]): boolean {
  const blockedIds = new Set(blocklist.map((entry) => entry.card_id));

  return blockedIds.has(card.card_id);
}

export function getFutureMirrorThemeCards(blocklist: CardBlocklist[] = []): CardDraft[] {
  const campaignCardIds = new Set(DEFAULT_PHASE6_CAMPAIGN.card_pool_ids);

  return getPublishableCardDrafts()
    .filter((card) => campaignCardIds.has(card.card_id))
    .filter((card) => !cardIsBlocked(card, blocklist));
}

export function selectLaunchCardForEvent(
  event: VisionEvent,
  blocklist: CardBlocklist[] = []
): CardDraft | null {
  const availableCards = getFutureMirrorThemeCards(blocklist);
  const triggerCandidates = availableCards.filter(
    (card) =>
      card.interaction_triggers.includes(event.type) &&
      DEFAULT_PHASE6_CAMPAIGN.enabled_triggers.includes(event.type)
  );
  const candidates =
    triggerCandidates.length > 0
      ? triggerCandidates
      : availableCards.filter((card) => card.interaction_triggers.includes("manual_draw"));

  if (candidates.length === 0) {
    return availableCards[0] ?? null;
  }

  return candidates[Math.abs(event.timestamp) % candidates.length];
}

export function createPublicAnonymousEvent(input: PublicAnonymousEvent): PublicAnonymousEvent {
  return PublicAnonymousEventSchema.parse(input);
}

export function createPosterRenderRequest(
  cardId: string,
  resultTone: ResultTone,
  qrTarget = QR_TARGET
): PosterRenderRequest {
  return PosterRenderRequestSchema.parse({
    campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
    card_id: cardId,
    theme_id: DEFAULT_PHASE6_CAMPAIGN.theme_id,
    result_tone: resultTone,
    qr_target: qrTarget,
    disclaimer_required: true
  });
}

export function createPosterRenderModel(
  request: PosterRenderRequest,
  card: Pick<CardDraft, "card_id" | "safe_title" | "safe_copy" | "action_suggestion">
): PosterRenderModel {
  const parsedRequest = PosterRenderRequestSchema.parse(request);

  return {
    campaign_id: parsedRequest.campaign_id,
    theme_name: FUTURE_MIRROR_THEME_PACK.name,
    template_id: FUTURE_MIRROR_THEME_PACK.poster_template_id,
    card_id: card.card_id,
    card_title: card.safe_title,
    result_tone: parsedRequest.result_tone,
    safe_copy: card.safe_copy,
    action_suggestion: card.action_suggestion,
    qr_target: parsedRequest.qr_target,
    disclaimer: RELEASE_DISCLAIMER,
    includes_raw_face: false
  };
}

function launchDecision(report: Omit<Phase6LaunchReport, "go_no_go_decision">): Phase6LaunchReport["go_no_go_decision"] {
  const targets = DEFAULT_PHASE6_CAMPAIGN.metrics_targets;

  if (report.negative_feedback_count > targets.negative_feedback_count) {
    return "no-go";
  }

  return report.completion_rate >= targets.completion_rate &&
    report.manual_completion_rate >= targets.manual_completion_rate &&
    report.action_success_rate >= targets.action_success_rate &&
    report.poster_generation_rate >= targets.poster_generation_rate &&
    report.share_click_rate >= targets.share_click_rate
    ? "go"
    : "hold";
}

export function buildPhase6LaunchReport(
  sessions: GraySessionSummary[],
  events: PublicAnonymousEvent[],
  blocklist: CardBlocklist[],
  negativeFeedbackCount = 0
): Phase6LaunchReport {
  const manualSessions = sessions.filter((session) => session.manual_mode_used);
  const actionTimeouts = sessions.filter((session) =>
    session.fallback_reasons.includes("action_timeout" as FallbackReason)
  ).length;
  const baseReport = {
    campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
    sample_size: sessions.length,
    completion_rate: roundRate(sessions.filter((session) => session.completed).length, sessions.length),
    manual_completion_rate: roundRate(
      manualSessions.filter((session) => session.completed).length,
      manualSessions.length
    ),
    action_success_rate: roundRate(sessions.length - actionTimeouts, sessions.length),
    poster_generation_rate: roundRate(
      events.filter((event) => event.event_type === "poster_generated").length,
      sessions.length
    ),
    share_click_rate: roundRate(
      events.filter((event) => event.event_type === "share_clicked").length,
      sessions.length
    ),
    negative_feedback_count: negativeFeedbackCount,
    blocked_cards: blocklist.map((entry) => entry.card_id)
  };

  return Phase6LaunchReportSchema.parse({
    ...baseReport,
    go_no_go_decision: launchDecision(baseReport)
  });
}

export const samplePhase6Sessions: GraySessionSummary[] = [
  {
    session_id: "GS-101",
    batch_id: "GRAY-001",
    completed: true,
    manual_mode_used: false,
    result_reached: true,
    duration_ms: 68_000,
    fallback_reasons: [],
    event_count: 7
  },
  {
    session_id: "GS-102",
    batch_id: "GRAY-001",
    completed: true,
    manual_mode_used: true,
    result_reached: true,
    duration_ms: 52_000,
    fallback_reasons: [],
    event_count: 5
  },
  {
    session_id: "GS-103",
    batch_id: "GRAY-001",
    completed: true,
    manual_mode_used: false,
    result_reached: true,
    duration_ms: 74_000,
    fallback_reasons: [],
    event_count: 6
  }
];

export const samplePublicLaunchEvents: PublicAnonymousEvent[] = samplePhase6Sessions.flatMap((session, index) => {
  const bucket = durationBucket(session.duration_ms);
  const baseTimestamp = 1_770_000_000_000 + index * 10;

  return [
    createPublicAnonymousEvent({
      event_type: "poster_generated",
      campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
      session_step: "result",
      trigger: session.manual_mode_used ? "manual_draw" : "look_stable",
      card_group: session.manual_mode_used ? "手动问镜" : "三停流转",
      duration_bucket: bucket,
      timestamp: baseTimestamp
    }),
    createPublicAnonymousEvent({
      event_type: "share_clicked",
      campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
      session_step: "result",
      trigger: session.manual_mode_used ? "manual_draw" : "look_stable",
      card_group: session.manual_mode_used ? "手动问镜" : "三停流转",
      duration_bucket: bucket,
      timestamp: baseTimestamp + 1
    })
  ];
});

export const samplePhase6LaunchReport = buildPhase6LaunchReport(samplePhase6Sessions, samplePublicLaunchEvents, []);
export const phase6ThemeCardCount = getFutureMirrorThemeCards([]).length;
