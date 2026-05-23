import type { CardRule, VisionEvent, VisionEventType } from "./contracts";
import type { CardDraft } from "./knowledge-contracts";
import { getPhase2Handoff } from "./knowledge-query";
import { termEntries } from "./knowledge-data";

function toCardRule(card: CardDraft, trigger: VisionEventType, index: number): CardRule | null {
  const term = termEntries.find((entry) => entry.term_id === card.term_id);

  if (!term) {
    return null;
  }

  return {
    rule_id: `R-P2-${(index + 1).toString().padStart(3, "0")}`,
    source_id: term.source_refs[0],
    term: term.term,
    risk_level: term.risk_level,
    input_tags: [term.category, card.card_group],
    trigger,
    card_id: card.card_id,
    safe_copy: `${card.safe_copy}${card.action_suggestion}`,
    blocked_claims: term.blocked_claims,
    review_status: term.review_status
  };
}

export function selectPhase2CardForVisionEvent(event: VisionEvent): CardRule | null {
  const handoff = getPhase2Handoff();
  const cards = handoff.cards_by_trigger[event.type];

  if (cards.length === 0) {
    return null;
  }

  const selectedIndex = Math.abs(event.timestamp) % cards.length;

  return toCardRule(cards[selectedIndex], event.type, selectedIndex);
}
