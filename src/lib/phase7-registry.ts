import type { VisionEvent, VisionEventType } from "./contracts";
import type { CardDraft, CardGroup } from "./knowledge-contracts";
import { termEntries } from "./knowledge-data";
import { getPublishableCardDrafts } from "./knowledge-query";
import { CardResultSchema, type CardResult, type ResultTone } from "./mvp-contracts";
import type { CardBlocklist } from "./phase5-contracts";
import { scanUnsafeClaims } from "./rules";
import {
  DEFAULT_PHASE6_CAMPAIGN,
  FUTURE_MIRROR_THEME_PACK,
  type PosterRenderModel
} from "./phase6-launch";
import {
  CampaignConfigV02Schema,
  Phase7ReuseReportSchema,
  ScenarioConfigSchema,
  ThemePackV02Schema,
  ThemeRegistrySchema,
  VenueActivationSchema,
  type CampaignConfigV02,
  type Phase7ReuseReport,
  type ScenarioConfig,
  type ThemePackV02,
  type ThemeRegistry,
  type VenueActivation
} from "./phase7-contracts";

const REVIEWED_AT = "2026-04-30T00:00:00.000Z";
const PUBLIC_DISCLAIMER =
  "本体验为传统文化娱乐互动，不能作为性格、命运、健康、婚恋、职业、财务或任何重要事项的判断依据。";
const ONSITE_PRIVACY_NOTICE =
  "本体验仅在设备端处理摄像头动作，不上传原始图片、视频或人脸模板；你可以拒绝开镜并使用手动抽卡。";
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
const MOUNTAIN_RIVER_GROUPS: CardGroup[] = ["山河五岳", "三停流转", "神气心相"];
const MOUNTAIN_RIVER_FORBIDDEN = [
  "命运",
  "寿命",
  "刑克",
  "财富预测",
  "职业成败",
  "地域优劣",
  "城市运势",
  "人群标签",
  "贵贱",
  "地域高低"
] as const;

export type Phase7PosterRenderModel = PosterRenderModel & {
  campaign_display_name: string;
  visual_motif: string;
  venue_notice_required: boolean;
  onsite_notice_copy: string;
};

function hasForbiddenClaim(card: CardDraft, forbiddenClaims: readonly string[]): boolean {
  const copy = `${card.safe_title}${card.safe_copy}${card.action_suggestion}`;

  return forbiddenClaims.some((claim) => copy.includes(claim));
}

function campaignCardPoolIds(groups: CardGroup[], forbiddenClaims: readonly string[]): string[] {
  return getPublishableCardDrafts()
    .filter((card) => groups.includes(card.card_group))
    .filter((card) => !hasForbiddenClaim(card, forbiddenClaims))
    .map((card) => card.card_id);
}

export const FUTURE_MIRROR_THEME_PACK_V02: ThemePackV02 = ThemePackV02Schema.parse({
  ...FUTURE_MIRROR_THEME_PACK,
  scenario_fit: ["毕业季", "求职季", "线上 H5 活动"],
  visual_motif: "书页、目标线、印章和轻量行动锦囊",
  recommended_surfaces: ["web_h5"],
  forbidden_claims: ["命定前程", "财富预测", "职业成败", "必成", "升职", "发财"]
});

export const DEFAULT_PHASE7_CAMPAIGN: CampaignConfigV02 = CampaignConfigV02Schema.parse({
  ...DEFAULT_PHASE6_CAMPAIGN,
  scenario_id: "SCN-001",
  display_name: "前程镜线上发布版",
  entry_qr_target: "https://example.com/qiancheng",
  venue_notice_required: false,
  operator_contact: "ops-qiancheng@example.com"
});

export const MOUNTAIN_RIVER_THEME_PACK: ThemePackV02 = ThemePackV02Schema.parse({
  theme_id: "THEME-SHANHE-001",
  name: "山河镜",
  safe_positioning: "文旅、城市展陈和国风市集互动卡牌，只提供城市漫游、空间观察、路线拆解和展陈打卡建议。",
  copy_tone: "清朗、游览感、行动导向，不评价城市、地域或人群优劣。",
  allowed_card_groups: MOUNTAIN_RIVER_GROUPS,
  result_templates: [
    "本次山河镜抽到 {card_title}，适合把眼前路线拆成一段可完成的城市漫游。",
    "今日打卡建议：{action_suggestion}",
    PUBLIC_DISCLAIMER
  ],
  poster_template_id: "POSTER-SHANHE-001",
  disclaimer_policy_id: "DISCLAIMER-PUBLIC-001",
  review_status: "approved",
  scenario_fit: ["文旅空间", "城市展陈", "国风市集", "品牌联名"],
  visual_motif: "山水纹样、城市场景线、展陈二维码和非人脸主题视觉",
  recommended_surfaces: ["web_h5", "onsite_exhibition", "brand_popup"],
  forbidden_claims: [...MOUNTAIN_RIVER_FORBIDDEN]
});

export const MOUNTAIN_RIVER_CAMPAIGN: CampaignConfigV02 = CampaignConfigV02Schema.parse({
  campaign_id: "CMP-002",
  theme_id: MOUNTAIN_RIVER_THEME_PACK.theme_id,
  scenario_id: "SCN-002",
  display_name: "山河镜文旅预演版",
  surface: "web_h5",
  version: "phase7-shanhe-v0.1",
  started_at: REVIEWED_AT,
  ended_at: null,
  enabled_triggers: ALL_TRIGGERS,
  card_pool_ids: campaignCardPoolIds(MOUNTAIN_RIVER_GROUPS, MOUNTAIN_RIVER_FORBIDDEN),
  blocked_card_ids: [],
  feedback_url: "https://example.com/shanhe/feedback",
  entry_qr_target: "https://example.com/shanhe",
  venue_notice_required: true,
  operator_contact: "ops-shanhe@example.com",
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

export const MOUNTAIN_RIVER_SCENARIO: ScenarioConfig = ScenarioConfigSchema.parse({
  scenario_id: "SCN-002",
  name: "山河镜第二场景",
  audience: "文旅空间、城市展陈、国风市集和品牌联名观众",
  surface: "web_h5",
  venue_type: "文旅展陈",
  privacy_notice: ONSITE_PRIVACY_NOTICE,
  default_theme_id: MOUNTAIN_RIVER_THEME_PACK.theme_id,
  enabled_campaign_ids: [MOUNTAIN_RIVER_CAMPAIGN.campaign_id]
});

const FUTURE_MIRROR_SCENARIO: ScenarioConfig = ScenarioConfigSchema.parse({
  scenario_id: "SCN-001",
  name: "前程镜线上活动",
  audience: "毕业季、求职季和线上 H5 用户",
  surface: "web_h5",
  venue_type: "线上H5",
  privacy_notice: "本体验默认不上传原始图片、视频或人脸模板；你可以不开摄像头直接手动抽卡。",
  default_theme_id: FUTURE_MIRROR_THEME_PACK_V02.theme_id,
  enabled_campaign_ids: [DEFAULT_PHASE7_CAMPAIGN.campaign_id]
});

export const PHASE7_THEME_REGISTRY: ThemeRegistry = ThemeRegistrySchema.parse({
  default_campaign_id: DEFAULT_PHASE7_CAMPAIGN.campaign_id,
  themes: [FUTURE_MIRROR_THEME_PACK_V02, MOUNTAIN_RIVER_THEME_PACK],
  campaigns: [DEFAULT_PHASE7_CAMPAIGN, MOUNTAIN_RIVER_CAMPAIGN],
  scenarios: [FUTURE_MIRROR_SCENARIO, MOUNTAIN_RIVER_SCENARIO],
  owner_roles: ["product", "content", "compliance", "legal", "engineering", "operations"],
  preferred_card_groups: MOUNTAIN_RIVER_GROUPS
});

function campaignById(campaignId: string): CampaignConfigV02 {
  const campaign = PHASE7_THEME_REGISTRY.campaigns.find((item) => item.campaign_id === campaignId);

  if (!campaign) {
    throw new Error(`Unknown campaign: ${campaignId}`);
  }

  return campaign;
}

export function getRegistryCampaigns(): CampaignConfigV02[] {
  return PHASE7_THEME_REGISTRY.campaigns;
}

export function getCampaignThemePack(campaignId: string): ThemePackV02 {
  const campaign = campaignById(campaignId);
  const theme = PHASE7_THEME_REGISTRY.themes.find((item) => item.theme_id === campaign.theme_id);

  if (!theme) {
    throw new Error(`Missing theme for campaign: ${campaignId}`);
  }

  return theme;
}

export function getScenarioForCampaign(campaignId: string): ScenarioConfig {
  const campaign = campaignById(campaignId);
  const scenario = PHASE7_THEME_REGISTRY.scenarios.find((item) => item.scenario_id === campaign.scenario_id);

  if (!scenario) {
    throw new Error(`Missing scenario for campaign: ${campaignId}`);
  }

  return scenario;
}

export function getThemeCardsForCampaign(
  campaignId: string,
  blocklist: CardBlocklist[] = []
): CardDraft[] {
  const campaign = campaignById(campaignId);
  const blockedIds = new Set([...campaign.blocked_card_ids, ...blocklist.map((entry) => entry.card_id)]);
  const allowedIds = new Set(campaign.card_pool_ids);

  return getPublishableCardDrafts()
    .filter((card) => allowedIds.has(card.card_id))
    .filter((card) => !blockedIds.has(card.card_id));
}

export function selectPhase7CardForEvent(
  campaignId: string,
  event: VisionEvent,
  blocklist: CardBlocklist[] = []
): CardDraft | null {
  const campaign = campaignById(campaignId);
  const cards = getThemeCardsForCampaign(campaignId, blocklist);
  const triggerCards = cards.filter(
    (card) => card.interaction_triggers.includes(event.type) && campaign.enabled_triggers.includes(event.type)
  );
  const candidates = triggerCards.length > 0 ? triggerCards : cards.filter((card) => card.interaction_triggers.includes("manual_draw"));

  if (candidates.length === 0) {
    return cards[0] ?? null;
  }

  return candidates[Math.abs(event.timestamp) % candidates.length];
}

export function drawPhase7CardResultForEvent(
  campaignId: string,
  event: VisionEvent,
  blocklist: CardBlocklist[] = []
): CardResult | null {
  const card = selectPhase7CardForEvent(campaignId, event, blocklist);

  if (!card || scanUnsafeClaims(`${card.safe_copy}${card.action_suggestion}`).length > 0) {
    return null;
  }

  const term = termEntries.find((entry) => entry.term_id === card.term_id);

  if (!term) {
    return null;
  }

  return CardResultSchema.parse({
    card_id: card.card_id,
    term_id: card.term_id,
    trigger: event.type,
    source_id: term.source_refs[0],
    safe_title: card.safe_title,
    safe_copy: card.safe_copy,
    modern_gloss: term.modern_gloss,
    action_suggestion: card.action_suggestion,
    disclaimer_required: card.disclaimer_required
  });
}

export function createPhase7PosterRenderModel(
  campaignId: string,
  card: Pick<CardDraft, "card_id" | "safe_title" | "safe_copy" | "action_suggestion">,
  resultTone: ResultTone
): Phase7PosterRenderModel {
  const campaign = campaignById(campaignId);
  const theme = getCampaignThemePack(campaignId);
  const scenario = getScenarioForCampaign(campaignId);

  return {
    campaign_id: campaign.campaign_id,
    campaign_display_name: campaign.display_name,
    theme_name: theme.name,
    template_id: theme.poster_template_id,
    visual_motif: theme.visual_motif,
    card_id: card.card_id,
    card_title: card.safe_title,
    result_tone: resultTone,
    safe_copy: card.safe_copy,
    action_suggestion: card.action_suggestion,
    qr_target: campaign.entry_qr_target,
    disclaimer: PUBLIC_DISCLAIMER,
    venue_notice_required: campaign.venue_notice_required,
    onsite_notice_copy: scenario.privacy_notice,
    includes_raw_face: false
  };
}

export function createVenueActivation(input: {
  venue_name: string;
  city: string;
  start_at: string;
  end_at: string;
}): VenueActivation {
  return VenueActivationSchema.parse({
    activation_id: "ACT-001",
    scenario_id: MOUNTAIN_RIVER_SCENARIO.scenario_id,
    venue_name: input.venue_name,
    city: input.city,
    start_at: input.start_at,
    end_at: input.end_at,
    qr_target: MOUNTAIN_RIVER_CAMPAIGN.entry_qr_target,
    onsite_notice_copy: MOUNTAIN_RIVER_SCENARIO.privacy_notice,
    staff_sop_id: "SOP-SHANHE-001"
  });
}

export function buildPhase7ReuseReport(scenarioId: string): Phase7ReuseReport {
  const scenario = PHASE7_THEME_REGISTRY.scenarios.find((item) => item.scenario_id === scenarioId);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${scenarioId}`);
  }

  const campaigns = PHASE7_THEME_REGISTRY.campaigns.filter((campaign) =>
    scenario.enabled_campaign_ids.includes(campaign.campaign_id)
  );
  const campaignCardIds = new Set(campaigns.flatMap((campaign) => campaign.card_pool_ids));
  const theme = PHASE7_THEME_REGISTRY.themes.find((item) => item.theme_id === scenario.default_theme_id);
  const publishableCardCount = getPublishableCardDrafts().filter((card) => campaignCardIds.has(card.card_id)).length;
  const posterTemplateReady = Boolean(theme?.poster_template_id);
  const privacyReady = scenario.privacy_notice.includes("不上传原始图片") && scenario.privacy_notice.includes("人脸模板");
  const contentReviewReady = theme?.review_status === "approved" && publishableCardCount > 0;

  return Phase7ReuseReportSchema.parse({
    scenario_id: scenario.scenario_id,
    theme_id: scenario.default_theme_id,
    campaign_count: campaigns.length,
    publishable_card_count: publishableCardCount,
    poster_template_ready: posterTemplateReady,
    privacy_ready: privacyReady,
    content_review_ready: contentReviewReady,
    go_no_go_decision: posterTemplateReady && privacyReady && contentReviewReady ? "go" : "hold"
  });
}

export const samplePhase7ReuseReport = buildPhase7ReuseReport(MOUNTAIN_RIVER_SCENARIO.scenario_id);
export const phase7MountainRiverCardCount = getThemeCardsForCampaign(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, []).length;
