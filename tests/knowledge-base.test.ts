import { describe, expect, it } from "vitest";

import {
  CARD_GROUPS,
  KNOWLEDGE_CATEGORIES,
  CardDraftSchema,
  KnowledgeQuerySchema,
  ReviewRecordSchema,
  RiskTagSchema,
  TermEntrySchema
} from "../src/lib/knowledge-contracts";
import {
  cardDrafts,
  knowledgeBaseSummary,
  knowledgeSourcesV02,
  reviewRecords,
  riskTags,
  termEntries
} from "../src/lib/knowledge-data";
import {
  exportPublishableCardRules,
  getPhase2Handoff,
  queryCardDrafts,
  queryTermEntries,
  validateKnowledgeBase
} from "../src/lib/knowledge-query";

describe("phase 1 knowledge-base contracts", () => {
  it("defines the eight planned knowledge categories and card groups", () => {
    expect(KNOWLEDGE_CATEGORIES).toEqual([
      "三停",
      "五官",
      "五岳四渎",
      "五行形局",
      "神气心相",
      "威仪动态",
      "铁关刀部位",
      "禁用研究"
    ]);
    expect(CARD_GROUPS).toEqual([
      "三停流转",
      "五官守护",
      "山河五岳",
      "五行形局",
      "神气心相",
      "铁关刀秘钥",
      "手动问镜"
    ]);
  });

  it("validates source v0.2, term, card, risk, review, and query records", () => {
    expect(() => TermEntrySchema.parse(termEntries[0])).not.toThrow();
    expect(() => CardDraftSchema.parse(cardDrafts[0])).not.toThrow();
    expect(() => RiskTagSchema.parse(riskTags[0])).not.toThrow();
    expect(() => ReviewRecordSchema.parse(reviewRecords[0])).not.toThrow();
    expect(() =>
      KnowledgeQuerySchema.parse({
        category: "三停",
        risk_level: "A",
        review_status: "approved",
        trigger: "look_stable"
      })
    ).not.toThrow();
    expect(knowledgeSourcesV02.length).toBeGreaterThanOrEqual(12);
  });

  it("ships 300-500 term entries and at least 300 card drafts", () => {
    expect(termEntries.length).toBeGreaterThanOrEqual(300);
    expect(termEntries.length).toBeLessThanOrEqual(500);
    expect(cardDrafts.length).toBeGreaterThanOrEqual(300);
    expect(knowledgeBaseSummary.term_count).toBe(termEntries.length);
    expect(knowledgeBaseSummary.card_draft_count).toBe(cardDrafts.length);
  });

  it("keeps every term traceable to a known source with explicit risk and review state", () => {
    const sourceIds = new Set(knowledgeSourcesV02.map((source) => source.source_id));

    expect(
      termEntries.every(
        (term) =>
          term.source_refs.length > 0 &&
          term.source_refs.every((sourceId) => sourceIds.has(sourceId)) &&
          term.original_excerpt.trim().length > 0 &&
          term.modern_gloss.trim().length > 0 &&
          term.blocked_claims.length > 0 &&
          term.collation_status.length > 0 &&
          term.review_status.length > 0
      )
    ).toBe(true);
  });

  it("queries terms by source, category, risk, review, and trigger", () => {
    const santing = queryTermEntries({ category: "三停", risk_level: "A" });
    expect(santing.length).toBeGreaterThan(0);
    expect(santing.every((term) => term.category === "三停" && term.risk_level === "A")).toBe(true);

    const sourceFiltered = queryTermEntries({ source_id: "SRC-002", review_status: "approved" });
    expect(sourceFiltered.length).toBeGreaterThan(0);
    expect(sourceFiltered.every((term) => term.source_refs.includes("SRC-002"))).toBe(true);

    const smileCards = queryCardDrafts({ trigger: "smile" });
    expect(smileCards.length).toBeGreaterThan(0);
    expect(smileCards.every((card) => card.interaction_triggers.includes("smile"))).toBe(true);
  });

  it("exports only A/B approved card candidates without unsafe claims", () => {
    const exported = exportPublishableCardRules();

    expect(exported.length).toBeGreaterThanOrEqual(300);
    expect(exported.every((rule) => rule.review_status === "approved")).toBe(true);
    expect(exported.every((rule) => rule.risk_level === "A" || rule.risk_level === "B")).toBe(true);
    expect(exported.every((rule) => !["疾病", "寿命", "怀孕", "刑克", "贵贱"].some((claim) => rule.safe_copy.includes(claim)))).toBe(true);
  });

  it("provides Phase 2/3 handoff candidates for every VisionEvent trigger", () => {
    const handoff = getPhase2Handoff();

    expect(handoff.triggers).toEqual([
      "look_stable",
      "blink",
      "smile",
      "brow_up",
      "mouth_open",
      "head_turn",
      "eyes_closed",
      "manual_draw"
    ]);
    for (const trigger of handoff.triggers) {
      expect(handoff.cards_by_trigger[trigger].length).toBeGreaterThan(0);
    }
  });

  it("validates the whole knowledge base with content safety checks", () => {
    const report = validateKnowledgeBase();

    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.term_count).toBe(termEntries.length);
    expect(report.publishable_card_count).toBeGreaterThanOrEqual(300);
  });
});
