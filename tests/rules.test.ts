import { describe, expect, it } from "vitest";

import { sampleRules, sourceRecords } from "../src/lib/phase0-content";
import { scanUnsafeClaims, selectCardForVisionEvent } from "../src/lib/rules";

describe("phase 0 rule engine guardrails", () => {
  it("selects only approved low-risk rules for a vision event", () => {
    const selected = selectCardForVisionEvent(
      {
        type: "smile",
        confidence: 0.9,
        quality_score: 0.88,
        timestamp: 1770000000000
      },
      sampleRules
    );

    expect(selected?.card_id).toBe("CARD-HEQI-001");
    expect(selected?.risk_level).toMatch(/A|B/);
    expect(selected?.review_status).toBe("approved");
  });

  it("falls back to manual draw when camera permission is refused", () => {
    const selected = selectCardForVisionEvent(
      {
        type: "manual_draw",
        confidence: 1,
        quality_score: 1,
        timestamp: 1770000000000
      },
      sampleRules
    );

    expect(selected?.card_id).toBe("CARD-MANUAL-001");
  });

  it("detects unsafe deterministic claims before publishing copy", () => {
    expect(scanUnsafeClaims("你一定会富贵并且寿命很长。")).toEqual(["一定", "富贵", "寿命"]);
    expect(scanUnsafeClaims("本结果为传统文化娱乐解读，适合作为今日行动提醒。")).toEqual([]);
  });

  it("ships enough source records to seed phase 1 knowledge work", () => {
    expect(sourceRecords.length).toBeGreaterThanOrEqual(10);
    expect(sourceRecords.every((record) => record.source_url.startsWith("https://"))).toBe(true);
  });
});
