import type { CardDraft } from "./knowledge-contracts";
import {
  ContentAuditRecordSchema,
  SafetyScanReportSchema,
  type ContentAuditRecord,
  type SafetyScanReport
} from "./phase4-contracts";

export const PHASE4_PROHIBITED_CLAIMS = [
  "一定",
  "必然",
  "命中注定",
  "预测准确",
  "准确预测",
  "算命",
  "改命",
  "富贵",
  "贫贱",
  "贵贱",
  "寿命",
  "寿夭",
  "疾病",
  "健康风险",
  "怀孕",
  "生育",
  "生育能力",
  "婚姻结果",
  "婚恋结果",
  "刑克",
  "克夫",
  "克妻",
  "孤寡",
  "犯罪倾向",
  "智力低",
  "种族",
  "民族",
  "宗教",
  "政治倾向",
  "性取向"
] as const;

function cardVisibleCopy(card: CardDraft): string {
  return `${card.safe_title}\n${card.safe_copy}\n${card.action_suggestion}`;
}

export function scanPhase4RiskClaims(copy: string): string[] {
  return PHASE4_PROHIBITED_CLAIMS.filter((claim) => copy.includes(claim));
}

export function buildSafetyScanReport(cards: CardDraft[]): SafetyScanReport {
  const riskHitsByClaim: Record<string, number> = {};
  const unsafeIds: string[] = [];
  let rewriteCount = 0;

  for (const card of cards) {
    const hits = scanPhase4RiskClaims(cardVisibleCopy(card));

    if (hits.length > 0) {
      unsafeIds.push(card.card_id);
      rewriteCount += 1;
      for (const hit of hits) {
        riskHitsByClaim[hit] = (riskHitsByClaim[hit] ?? 0) + 1;
      }
    }
  }

  return SafetyScanReportSchema.parse({
    total_cards: cards.length,
    passed_count: cards.length - unsafeIds.length,
    blocked_count: 0,
    rewrite_count: rewriteCount,
    unsafe_ids: unsafeIds,
    risk_hits_by_claim: riskHitsByClaim
  });
}

export function createContentAuditRecords(
  cards: CardDraft[],
  reviewedAt = new Date().toISOString()
): ContentAuditRecord[] {
  return cards.map((card) => {
    const riskHits = scanPhase4RiskClaims(cardVisibleCopy(card));

    return ContentAuditRecordSchema.parse({
      target_type: "card",
      target_id: card.card_id,
      risk_hits: riskHits,
      decision: riskHits.length === 0 ? "pass" : "rewrite",
      reviewer_role: "compliance",
      notes:
        riskHits.length === 0
          ? "Phase 4 automated scan passed; final legal review pending before public launch."
          : "Phase 4 automated scan found prohibited claims; rewrite before user exposure.",
      reviewed_at: reviewedAt
    });
  });
}
