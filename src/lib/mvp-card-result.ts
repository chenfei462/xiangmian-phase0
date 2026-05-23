import type { VisionEvent } from "./contracts";
import type { CardDraft } from "./knowledge-contracts";
import { knowledgeSourcesV02, termEntries } from "./knowledge-data";
import { getPhase2Handoff } from "./knowledge-query";
import { scanUnsafeClaims } from "./rules";
import {
  CardResultSchema,
  type CardResult,
  type ResultTone
} from "./mvp-contracts";

export type ToneResultCopy = {
  card_id: string;
  tone: ResultTone;
  label: string;
  copy: string;
};

function cardIndexForEvent(event: VisionEvent, cards: CardDraft[]): number {
  return Math.abs(event.timestamp) % cards.length;
}

export function drawMvpCardForEvent(event: VisionEvent): CardResult | null {
  const cards = getPhase2Handoff().cards_by_trigger[event.type];

  if (cards.length === 0) {
    return null;
  }

  const card = cards[cardIndexForEvent(event, cards)];
  const term = termEntries.find((entry) => entry.term_id === card.term_id);

  if (!term || scanUnsafeClaims(`${card.safe_copy}${card.action_suggestion}`).length > 0) {
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

export function renderResultTone(result: CardResult, tone: ResultTone): ToneResultCopy {
  switch (tone) {
    case "classic":
      return {
        card_id: result.card_id,
        tone,
        label: "更古籍",
        copy: result.safe_copy
      };
    case "light":
      return {
        card_id: result.card_id,
        tone,
        label: "更轻松",
        copy: `换个轻松说法：${result.safe_copy}`
      };
    case "action":
      return {
        card_id: result.card_id,
        tone,
        label: "行动建议",
        copy: result.action_suggestion
      };
    default: {
      const exhaustive: never = tone;
      throw new Error(`Unhandled result tone: ${exhaustive}`);
    }
  }
}

export function getSourceTitle(sourceId: string): string {
  return knowledgeSourcesV02.find((source) => source.source_id === sourceId)?.book_title ?? sourceId;
}
