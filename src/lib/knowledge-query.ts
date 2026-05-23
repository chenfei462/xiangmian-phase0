import type { CardRule, ReviewStatus, RiskLevel, VisionEventType } from "./contracts";
import { scanUnsafeClaims } from "./rules";
import {
  KnowledgeQuerySchema,
  type CardDraft,
  type KnowledgeQuery,
  type TermEntry
} from "./knowledge-contracts";
import { cardDrafts, knowledgeSourcesV02, termEntries } from "./knowledge-data";

type ValidationReport = {
  valid: boolean;
  errors: string[];
  term_count: number;
  card_draft_count: number;
  publishable_card_count: number;
};

const PUBLISHABLE_RISKS: ReadonlySet<RiskLevel> = new Set(["A", "B"]);
const DEFAULT_REVIEW_STATUS: ReviewStatus = "approved";

function termForCard(card: CardDraft): TermEntry | undefined {
  return termEntries.find((entry) => entry.term_id === card.term_id);
}

function matchesTermQuery(entry: TermEntry, query: KnowledgeQuery): boolean {
  return (
    (!query.source_id || entry.source_refs.includes(query.source_id)) &&
    (!query.term || entry.term.includes(query.term)) &&
    (!query.category || entry.category === query.category) &&
    (!query.risk_level || entry.risk_level === query.risk_level) &&
    (!query.review_status || entry.review_status === query.review_status)
  );
}

function isPublishable(entry: TermEntry, card: CardDraft): boolean {
  return (
    PUBLISHABLE_RISKS.has(entry.risk_level) &&
    entry.review_status === DEFAULT_REVIEW_STATUS &&
    card.publish_status === "approved" &&
    scanUnsafeClaims(card.safe_copy).length === 0 &&
    scanUnsafeClaims(card.action_suggestion).length === 0
  );
}

export function queryTermEntries(queryInput: KnowledgeQuery = {}): TermEntry[] {
  const query = KnowledgeQuerySchema.parse(queryInput);

  if (query.trigger) {
    const termIds = new Set(
      queryCardDrafts({ trigger: query.trigger }).map((card) => card.term_id)
    );

    return termEntries.filter((entry) => termIds.has(entry.term_id) && matchesTermQuery(entry, query));
  }

  return termEntries.filter((entry) => matchesTermQuery(entry, query));
}

export function queryCardDrafts(queryInput: KnowledgeQuery = {}): CardDraft[] {
  const query = KnowledgeQuerySchema.parse(queryInput);

  return cardDrafts.filter((card) => {
    const term = termForCard(card);

    if (!term) {
      return false;
    }

    return (
      matchesTermQuery(term, query) &&
      (!query.trigger || card.interaction_triggers.includes(query.trigger))
    );
  });
}

export function getPublishableCardDrafts(): CardDraft[] {
  return cardDrafts.filter((card) => {
    const term = termForCard(card);

    return term ? isPublishable(term, card) : false;
  });
}

export function exportPublishableCardRules(): CardRule[] {
  return getPublishableCardDrafts().map((card, index) => {
    const term = termForCard(card);

    if (!term) {
      throw new Error(`Missing term for card ${card.card_id}`);
    }

    return {
      rule_id: `R-KB-${(index + 1).toString().padStart(3, "0")}`,
      source_id: term.source_refs[0],
      term: term.term,
      risk_level: term.risk_level,
      input_tags: [term.category, card.card_group],
      trigger: card.interaction_triggers[0],
      card_id: card.card_id,
      safe_copy: `${card.safe_copy}${card.action_suggestion}`,
      blocked_claims: term.blocked_claims,
      review_status: term.review_status
    };
  });
}

export function getPhase2Handoff(): {
  triggers: VisionEventType[];
  cards_by_trigger: Record<VisionEventType, CardDraft[]>;
} {
  const triggers: VisionEventType[] = [
    "look_stable",
    "blink",
    "smile",
    "brow_up",
    "mouth_open",
    "head_turn",
    "eyes_closed",
    "manual_draw"
  ];
  const publishable = getPublishableCardDrafts();

  return {
    triggers,
    cards_by_trigger: triggers.reduce<Record<VisionEventType, CardDraft[]>>(
      (buckets, trigger) => ({
        ...buckets,
        [trigger]: publishable.filter((card) => card.interaction_triggers.includes(trigger))
      }),
      {
        look_stable: [],
        blink: [],
        smile: [],
        brow_up: [],
        mouth_open: [],
        head_turn: [],
        eyes_closed: [],
        manual_draw: []
      }
    )
  };
}

export function validateKnowledgeBase(): ValidationReport {
  const errors: string[] = [];
  const sourceIds = new Set(knowledgeSourcesV02.map((source) => source.source_id));
  const termIds = new Set(termEntries.map((term) => term.term_id));
  const publishable = getPublishableCardDrafts();

  if (termEntries.length < 300 || termEntries.length > 500) {
    errors.push(`Term count must be 300-500, got ${termEntries.length}.`);
  }

  if (publishable.length < 300) {
    errors.push(`Publishable card count must be at least 300, got ${publishable.length}.`);
  }

  for (const term of termEntries) {
    if (!term.source_refs.every((sourceId) => sourceIds.has(sourceId))) {
      errors.push(`${term.term_id} references an unknown source.`);
    }
    if ((term.risk_level === "C" || term.risk_level === "D") && term.review_status !== "blocked") {
      errors.push(`${term.term_id} is high risk but not blocked.`);
    }
  }

  for (const card of cardDrafts) {
    const term = termForCard(card);
    if (!term || !termIds.has(card.term_id)) {
      errors.push(`${card.card_id} references an unknown term.`);
      continue;
    }
    if (!isPublishable(term, card) && card.publish_status === "approved") {
      errors.push(`${card.card_id} is approved but failed publishable safety checks.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    term_count: termEntries.length,
    card_draft_count: cardDrafts.length,
    publishable_card_count: publishable.length
  };
}
