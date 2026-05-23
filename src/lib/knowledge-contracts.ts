import { z } from "zod";

import {
  COLLATION_STATUSES,
  RISK_LEVELS,
  REVIEW_STATUSES,
  VISION_EVENT_TYPES,
  type RiskLevel,
  type VisionEventType
} from "./contracts";

export const KNOWLEDGE_CATEGORIES = [
  "三停",
  "五官",
  "五岳四渎",
  "五行形局",
  "神气心相",
  "威仪动态",
  "铁关刀部位",
  "禁用研究"
] as const;

export const CARD_GROUPS = [
  "三停流转",
  "五官守护",
  "山河五岳",
  "五行形局",
  "神气心相",
  "铁关刀秘钥",
  "手动问镜"
] as const;

export const PUBLISH_STATUSES = ["draft", "approved", "blocked"] as const;

export const SourceRecordV02Schema = z.object({
  source_id: z.string().regex(/^SRC-\d{3}$/),
  book_title: z.string().min(1),
  chapter: z.string().min(1),
  original_excerpt: z.string().min(1),
  modern_gloss: z.string().min(1),
  source_url: z.string().url(),
  collation_status: z.enum(COLLATION_STATUSES),
  risk_level: z.enum(RISK_LEVELS),
  source_type: z.enum(["classic_text", "technical", "legal", "reference"]),
  phase1_priority: z.number().int().min(1).max(5)
});

export const TermEntrySchema = z.object({
  term_id: z.string().regex(/^TERM-\d{3}$/),
  term: z.string().min(1),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  source_refs: z.array(z.string().regex(/^SRC-\d{3}$/)).min(1),
  original_excerpt: z.string().min(1),
  modern_gloss: z.string().min(1),
  risk_level: z.enum(RISK_LEVELS),
  blocked_claims: z.array(z.string().min(1)).min(1),
  collation_status: z.enum(COLLATION_STATUSES),
  review_status: z.enum(REVIEW_STATUSES)
});

export const CardDraftSchema = z.object({
  card_id: z.string().regex(/^CARD-KB-\d{3}$/),
  term_id: z.string().regex(/^TERM-\d{3}$/),
  card_group: z.enum(CARD_GROUPS),
  interaction_triggers: z.array(z.enum(VISION_EVENT_TYPES)).min(1),
  safe_title: z.string().min(1),
  safe_copy: z.string().min(1),
  action_suggestion: z.string().min(1),
  disclaimer_required: z.literal(true),
  publish_status: z.enum(PUBLISH_STATUSES)
});

export const RiskTagSchema = z.object({
  risk_level: z.enum(RISK_LEVELS),
  reason: z.string().min(1),
  prohibited_claims: z.array(z.string().min(1)),
  rewrite_guidance: z.string().min(1)
});

export const ReviewRecordSchema = z.object({
  review_id: z.string().regex(/^REV-\d{3}$/),
  batch_name: z.string().min(1),
  reviewer_role: z.enum(["content", "compliance", "product"]),
  review_status: z.enum(REVIEW_STATUSES),
  notes: z.string().min(1),
  checked_count: z.number().int().nonnegative()
});

export const KnowledgeQuerySchema = z.object({
  source_id: z.string().regex(/^SRC-\d{3}$/).optional(),
  term: z.string().min(1).optional(),
  category: z.enum(KNOWLEDGE_CATEGORIES).optional(),
  risk_level: z.enum(RISK_LEVELS).optional(),
  review_status: z.enum(REVIEW_STATUSES).optional(),
  trigger: z.enum(VISION_EVENT_TYPES).optional()
});

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];
export type CardGroup = (typeof CARD_GROUPS)[number];
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];
export type SourceRecordV02 = z.infer<typeof SourceRecordV02Schema>;
export type TermEntry = z.infer<typeof TermEntrySchema>;
export type CardDraft = z.infer<typeof CardDraftSchema>;
export type RiskTag = z.infer<typeof RiskTagSchema>;
export type ReviewRecord = z.infer<typeof ReviewRecordSchema>;
export type KnowledgeQuery = z.infer<typeof KnowledgeQuerySchema>;

export type PublishableRiskLevel = Extract<RiskLevel, "A" | "B">;
export type TriggerBuckets = Record<VisionEventType, CardDraft[]>;
