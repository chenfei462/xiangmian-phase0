import { describe, expect, it } from "vitest";

import type { VisionEvent } from "../src/lib/contracts";
import {
  CampaignConfigSchema,
  Phase6LaunchReportSchema,
  PosterRenderRequestSchema,
  PublicAnonymousEventSchema,
  ReleaseGateSchema,
  ThemePackSchema
} from "../src/lib/phase6-contracts";
import {
  DEFAULT_PHASE6_CAMPAIGN,
  FUTURE_MIRROR_THEME_PACK,
  PHASE6_RELEASE_GATES,
  buildPhase6LaunchReport,
  createPosterRenderModel,
  createPosterRenderRequest,
  createPublicAnonymousEvent,
  getFutureMirrorThemeCards,
  samplePhase6LaunchReport,
  selectLaunchCardForEvent
} from "../src/lib/phase6-launch";

const timestamp = 1770000000000;

function event(type: VisionEvent["type"], seed = timestamp): VisionEvent {
  return {
    type,
    confidence: 0.92,
    quality_score: 0.88,
    timestamp: seed
  };
}

describe("phase 6 launch contracts", () => {
  it("validates campaign, theme, release gate, public event, poster request, and launch report", () => {
    expect(() => CampaignConfigSchema.parse(DEFAULT_PHASE6_CAMPAIGN)).not.toThrow();
    expect(() => ThemePackSchema.parse(FUTURE_MIRROR_THEME_PACK)).not.toThrow();
    expect(() => ReleaseGateSchema.parse(PHASE6_RELEASE_GATES[0])).not.toThrow();
    expect(() =>
      PublicAnonymousEventSchema.parse({
        event_type: "poster_generated",
        campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
        session_step: "result",
        trigger: "manual_draw",
        card_group: "手动问镜",
        duration_bucket: "30_90s",
        timestamp
      })
    ).not.toThrow();
    expect(() =>
      PosterRenderRequestSchema.parse({
        campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
        card_id: "CARD-KB-001",
        theme_id: DEFAULT_PHASE6_CAMPAIGN.theme_id,
        result_tone: "action",
        qr_target: "https://example.com/qiancheng",
        disclaimer_required: true
      })
    ).not.toThrow();
    expect(() => Phase6LaunchReportSchema.parse(samplePhase6LaunchReport)).not.toThrow();
  });

  it("rejects public events and poster requests that contain identity or raw face data", () => {
    const publicEvent = createPublicAnonymousEvent({
      event_type: "campaign_viewed",
      campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
      session_step: "entry",
      duration_bucket: "under_30s",
      timestamp
    });
    const request = createPosterRenderRequest("CARD-KB-001", "classic");

    expect(PublicAnonymousEventSchema.safeParse({ ...publicEvent, user_id: "user-1" }).success).toBe(false);
    expect(PublicAnonymousEventSchema.safeParse({ ...publicEvent, phone: "13800000000" }).success).toBe(false);
    expect(PublicAnonymousEventSchema.safeParse({ ...publicEvent, face_landmarks: [] }).success).toBe(false);
    expect(PublicAnonymousEventSchema.safeParse({ ...publicEvent, raw_image: "data:image/png;base64,unsafe" }).success).toBe(false);
    expect(PosterRenderRequestSchema.safeParse({ ...request, face_image: "data:image/png;base64,unsafe" }).success).toBe(false);
    expect(PosterRenderRequestSchema.safeParse({ ...request, video_blob: "unsafe" }).success).toBe(false);
  });
});

describe("phase 6 future mirror theme pack", () => {
  it("selects only safe publishable campaign cards for the future mirror theme", () => {
    const cards = getFutureMirrorThemeCards([]);
    const forbidden = ["必成", "升职", "发财", "贵人", "命定前程", "财富预测", "职业成败"];

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every((card) => FUTURE_MIRROR_THEME_PACK.allowed_card_groups.includes(card.card_group))).toBe(true);
    for (const card of cards) {
      const copy = `${card.safe_title}${card.safe_copy}${card.action_suggestion}`;
      expect(forbidden.filter((term) => copy.includes(term))).toEqual([]);
    }
  });

  it("does not select a blocked card and falls back to another safe campaign card", () => {
    const firstSelected = selectLaunchCardForEvent(event("manual_draw"), []);

    expect(firstSelected).not.toBeNull();

    const nextSelected = selectLaunchCardForEvent(event("manual_draw"), [
      {
        card_id: firstSelected!.card_id,
        reason: "Phase 6 launch blocklist drill",
        blocked_at: "2026-04-30T00:00:00.000Z",
        reviewer_role: "content",
        notes: "Do not return this card during launch."
      }
    ]);

    expect(nextSelected).not.toBeNull();
    expect(nextSelected?.card_id).not.toBe(firstSelected?.card_id);
  });

  it("renders a poster model without original face imagery", () => {
    const card = selectLaunchCardForEvent(event("manual_draw"), []);

    expect(card).not.toBeNull();

    const request = createPosterRenderRequest(card!.card_id, "action");
    const poster = createPosterRenderModel(request, card!);

    expect(poster.card_id).toBe(card!.card_id);
    expect(poster.theme_name).toBe("前程镜");
    expect(poster.includes_raw_face).toBe(false);
    expect(JSON.stringify(poster)).not.toContain("face_image");
    expect(JSON.stringify(poster)).not.toContain("raw_image");
    expect(poster.disclaimer).toContain("传统文化娱乐互动");
  });
});

describe("phase 6 launch metrics", () => {
  it("computes launch metrics and returns go only when public targets pass", () => {
    const report = buildPhase6LaunchReport(
      [
        {
          session_id: "GS-101",
          batch_id: "GRAY-001",
          completed: true,
          manual_mode_used: false,
          result_reached: true,
          duration_ms: 68000,
          fallback_reasons: [],
          event_count: 7
        },
        {
          session_id: "GS-102",
          batch_id: "GRAY-001",
          completed: true,
          manual_mode_used: true,
          result_reached: true,
          duration_ms: 52000,
          fallback_reasons: [],
          event_count: 5
        }
      ],
      [
        createPublicAnonymousEvent({
          event_type: "poster_generated",
          campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
          session_step: "result",
          trigger: "manual_draw",
          card_group: "手动问镜",
          duration_bucket: "30_90s",
          timestamp
        }),
        createPublicAnonymousEvent({
          event_type: "share_clicked",
          campaign_id: DEFAULT_PHASE6_CAMPAIGN.campaign_id,
          session_step: "result",
          trigger: "manual_draw",
          card_group: "手动问镜",
          duration_bucket: "30_90s",
          timestamp: timestamp + 1
        })
      ],
      []
    );

    expect(report.sample_size).toBe(2);
    expect(report.completion_rate).toBe(1);
    expect(report.manual_completion_rate).toBe(1);
    expect(report.action_success_rate).toBe(1);
    expect(report.poster_generation_rate).toBe(0.5);
    expect(report.share_click_rate).toBe(0.5);
    expect(report.negative_feedback_count).toBe(0);
    expect(report.go_no_go_decision).toBe("go");
  });

  it("returns hold when launch metrics miss poster or action targets", () => {
    const report = buildPhase6LaunchReport(
      [
        {
          session_id: "GS-103",
          batch_id: "GRAY-001",
          completed: true,
          manual_mode_used: false,
          result_reached: true,
          duration_ms: 92000,
          fallback_reasons: ["action_timeout"],
          event_count: 4
        }
      ],
      [],
      []
    );

    expect(report.action_success_rate).toBe(0);
    expect(report.poster_generation_rate).toBe(0);
    expect(report.go_no_go_decision).toBe("hold");
  });
});
