import { describe, expect, it } from "vitest";

import type { VisionEvent } from "../src/lib/contracts";
import {
  CampaignConfigV02Schema,
  Phase7ReuseReportSchema,
  ScenarioConfigSchema,
  ThemePackV02Schema,
  ThemeRegistrySchema,
  VenueActivationSchema
} from "../src/lib/phase7-contracts";
import {
  DEFAULT_PHASE7_CAMPAIGN,
  MOUNTAIN_RIVER_CAMPAIGN,
  MOUNTAIN_RIVER_SCENARIO,
  MOUNTAIN_RIVER_THEME_PACK,
  PHASE7_THEME_REGISTRY,
  buildPhase7ReuseReport,
  createPhase7PosterRenderModel,
  createVenueActivation,
  drawPhase7CardResultForEvent,
  getCampaignThemePack,
  getRegistryCampaigns,
  getThemeCardsForCampaign,
  selectPhase7CardForEvent
} from "../src/lib/phase7-registry";

const timestamp = 1770000000000;

function event(type: VisionEvent["type"], seed = timestamp): VisionEvent {
  return {
    type,
    confidence: 0.91,
    quality_score: 0.87,
    timestamp: seed
  };
}

describe("phase 7 multi-theme contracts", () => {
  it("validates campaign v0.2, theme v0.2, scenario, registry, activation, and reuse report", () => {
    expect(() => CampaignConfigV02Schema.parse(MOUNTAIN_RIVER_CAMPAIGN)).not.toThrow();
    expect(() => ThemePackV02Schema.parse(MOUNTAIN_RIVER_THEME_PACK)).not.toThrow();
    expect(() => ScenarioConfigSchema.parse(MOUNTAIN_RIVER_SCENARIO)).not.toThrow();
    expect(() => ThemeRegistrySchema.parse(PHASE7_THEME_REGISTRY)).not.toThrow();
    expect(() =>
      VenueActivationSchema.parse(
        createVenueActivation({
          venue_name: "山河城市展台",
          city: "杭州",
          start_at: "2026-05-28T00:00:00.000Z",
          end_at: "2026-06-02T00:00:00.000Z"
        })
      )
    ).not.toThrow();
    expect(() => Phase7ReuseReportSchema.parse(buildPhase7ReuseReport(MOUNTAIN_RIVER_SCENARIO.scenario_id))).not.toThrow();
  });

  it("keeps the phase 6 future mirror campaign available as the default campaign", () => {
    const campaigns = getRegistryCampaigns();
    const future = campaigns.find((campaign) => campaign.theme_id === "THEME-QIANCHENG-001");

    expect(DEFAULT_PHASE7_CAMPAIGN.theme_id).toBe("THEME-QIANCHENG-001");
    expect(future).toBeDefined();
    expect(future?.display_name).toContain("前程镜");
    expect(getCampaignThemePack(future!.campaign_id).name).toBe("前程镜");
  });
});

describe("phase 7 mountain river theme", () => {
  it("registers mountain river as the second scenario with the expected card groups", () => {
    expect(MOUNTAIN_RIVER_THEME_PACK.name).toBe("山河镜");
    expect(MOUNTAIN_RIVER_THEME_PACK.allowed_card_groups).toEqual(
      expect.arrayContaining(["山河五岳", "三停流转", "神气心相"])
    );
    expect(MOUNTAIN_RIVER_SCENARIO.venue_type).toBe("文旅展陈");
    expect(MOUNTAIN_RIVER_SCENARIO.privacy_notice).toContain("不上传原始图片");
  });

  it("returns safe publishable mountain river cards for every enabled trigger", () => {
    const cards = getThemeCardsForCampaign(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, []);
    const forbidden = ["命运", "寿命", "刑克", "财富预测", "职业成败", "地域优劣", "城市运势", "人群标签"];

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => MOUNTAIN_RIVER_THEME_PACK.allowed_card_groups.includes(card.card_group))).toBe(true);

    for (const trigger of MOUNTAIN_RIVER_CAMPAIGN.enabled_triggers) {
      expect(cards.some((card) => card.interaction_triggers.includes(trigger))).toBe(true);
    }

    for (const card of cards) {
      const copy = `${card.safe_title}${card.safe_copy}${card.action_suggestion}`;
      expect(forbidden.filter((term) => copy.includes(term))).toEqual([]);
    }
  });

  it("uses the shared blocklist and never returns a blocked card", () => {
    const first = selectPhase7CardForEvent(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, event("manual_draw"), []);

    expect(first).not.toBeNull();

    const second = selectPhase7CardForEvent(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, event("manual_draw"), [
      {
        card_id: first!.card_id,
        reason: "Phase 7 mountain river blocklist drill",
        blocked_at: "2026-04-30T00:00:00.000Z",
        reviewer_role: "content",
        notes: "Do not return this card in the second scenario."
      }
    ]);

    expect(second).not.toBeNull();
    expect(second?.card_id).not.toBe(first?.card_id);
  });

  it("renders a mountain river poster without raw face imagery", () => {
    const card = selectPhase7CardForEvent(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, event("head_turn"), []);

    expect(card).not.toBeNull();

    const poster = createPhase7PosterRenderModel(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, card!, "classic");

    expect(poster.theme_name).toBe("山河镜");
    expect(poster.visual_motif).toContain("山水");
    expect(poster.qr_target).toBe(MOUNTAIN_RIVER_CAMPAIGN.entry_qr_target);
    expect(poster.includes_raw_face).toBe(false);
    expect(JSON.stringify(poster)).not.toContain("face_image");
    expect(JSON.stringify(poster)).not.toContain("raw_image");
  });

  it("draws a card result from the selected campaign pool", () => {
    const result = drawPhase7CardResultForEvent(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, event("manual_draw"));
    const campaignCards = getThemeCardsForCampaign(MOUNTAIN_RIVER_CAMPAIGN.campaign_id, []);

    expect(result).not.toBeNull();
    expect(campaignCards.map((card) => card.card_id)).toContain(result!.card_id);
  });

  it("produces a go reuse report for the second scenario", () => {
    const report = buildPhase7ReuseReport(MOUNTAIN_RIVER_SCENARIO.scenario_id);

    expect(report.scenario_id).toBe(MOUNTAIN_RIVER_SCENARIO.scenario_id);
    expect(report.theme_id).toBe(MOUNTAIN_RIVER_THEME_PACK.theme_id);
    expect(report.campaign_count).toBeGreaterThanOrEqual(1);
    expect(report.publishable_card_count).toBeGreaterThan(0);
    expect(report.poster_template_ready).toBe(true);
    expect(report.privacy_ready).toBe(true);
    expect(report.content_review_ready).toBe(true);
    expect(report.go_no_go_decision).toBe("go");
  });
});
