import { z } from "zod";

export const VISION_EVENT_TYPES = [
  "look_stable",
  "blink",
  "smile",
  "brow_up",
  "mouth_open",
  "head_turn",
  "eyes_closed",
  "manual_draw"
] as const;

export const RISK_LEVELS = ["A", "B", "C", "D"] as const;
export const REVIEW_STATUSES = ["pending", "approved", "blocked"] as const;
export const COLLATION_STATUSES = [
  "verified",
  "needs_collation",
  "ocr_unverified",
  "reference_only"
] as const;

export const VisionEventSchema = z.object({
  type: z.enum(VISION_EVENT_TYPES),
  confidence: z.number().min(0).max(1),
  quality_score: z.number().min(0).max(1),
  timestamp: z.number().int().nonnegative()
});

export const CardRuleSchema = z.object({
  rule_id: z.string().min(1),
  source_id: z.string().regex(/^SRC-\d{3}$/),
  term: z.string().min(1),
  risk_level: z.enum(RISK_LEVELS),
  input_tags: z.array(z.string().min(1)).min(1),
  trigger: z.enum(VISION_EVENT_TYPES),
  card_id: z.string().min(1),
  safe_copy: z.string().min(1),
  blocked_claims: z.array(z.string().min(1)),
  review_status: z.enum(REVIEW_STATUSES)
});

export const SourceRecordSchema = z.object({
  source_id: z.string().regex(/^SRC-\d{3}$/),
  book_title: z.string().min(1),
  chapter: z.string().min(1),
  original_excerpt: z.string().min(1),
  modern_gloss: z.string().min(1),
  source_url: z.string().url(),
  collation_status: z.enum(COLLATION_STATUSES),
  risk_level: z.enum(RISK_LEVELS)
});

export const PrivacyDefaultSchema = z.object({
  camera_frames: z.literal("local_only"),
  raw_image_upload: z.literal(false),
  biometric_template_storage: z.literal(false),
  identity_recognition: z.literal(false),
  analytics: z.literal("anonymous_events_only")
});

export type VisionEvent = z.infer<typeof VisionEventSchema>;
export type VisionEventType = (typeof VISION_EVENT_TYPES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type CollationStatus = (typeof COLLATION_STATUSES)[number];
export type CardRule = z.infer<typeof CardRuleSchema>;
export type SourceRecord = z.infer<typeof SourceRecordSchema>;
export type PrivacyDefault = z.infer<typeof PrivacyDefaultSchema>;
