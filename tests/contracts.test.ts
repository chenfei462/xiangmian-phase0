import { describe, expect, it } from "vitest";

import {
  CardRuleSchema,
  PrivacyDefaultSchema,
  SourceRecordSchema,
  VisionEventSchema,
  VISION_EVENT_TYPES
} from "../src/lib/contracts";

describe("phase 0 interface contracts", () => {
  it("freezes the v0.1 vision event action vocabulary", () => {
    expect(VISION_EVENT_TYPES).toEqual([
      "look_stable",
      "blink",
      "smile",
      "brow_up",
      "mouth_open",
      "head_turn",
      "eyes_closed",
      "manual_draw"
    ]);

    expect(
      VisionEventSchema.safeParse({
        type: "smile",
        confidence: 0.86,
        quality_score: 0.91,
        timestamp: 1770000000000
      }).success
    ).toBe(true);

    expect(
      VisionEventSchema.safeParse({
        type: "age_guess",
        confidence: 0.86,
        quality_score: 0.91,
        timestamp: 1770000000000
      }).success
    ).toBe(false);
  });

  it("requires card rules to carry source, risk, review, and blocked claims", () => {
    const result = CardRuleSchema.safeParse({
      rule_id: "R-SANTING-001",
      source_id: "SRC-002",
      term: "三停",
      risk_level: "A",
      input_tags: ["balanced_ratio"],
      trigger: "look_stable",
      card_id: "CARD-SANTING-001",
      safe_copy: "本次镜面抽到三停调和卡。",
      blocked_claims: ["富贵", "寿夭"],
      review_status: "approved"
    });

    expect(result.success).toBe(true);
  });

  it("requires source records to expose collation and risk metadata", () => {
    const result = SourceRecordSchema.safeParse({
      source_id: "SRC-001",
      book_title: "中国哲学书电子化计划",
      chapter: "主页",
      original_excerpt: "开放电子图书馆",
      modern_gloss: "传统文本检索入口。",
      source_url: "https://ctext.org/zh",
      collation_status: "verified",
      risk_level: "A"
    });

    expect(result.success).toBe(true);
  });

  it("keeps privacy defaults local-first and non-identifying", () => {
    const defaults = PrivacyDefaultSchema.parse({
      camera_frames: "local_only",
      raw_image_upload: false,
      biometric_template_storage: false,
      identity_recognition: false,
      analytics: "anonymous_events_only"
    });

    expect(defaults.raw_image_upload).toBe(false);
    expect(defaults.identity_recognition).toBe(false);
  });
});
