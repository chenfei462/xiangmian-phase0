import { z } from "zod";

import { VISION_EVENT_TYPES } from "./contracts";
import { CARD_GROUPS } from "./knowledge-contracts";
import { MVP_SESSION_STATES } from "./mvp-contracts";

export const AUDIT_TARGET_TYPES = ["card", "term", "disclaimer", "flow"] as const;
export const AUDIT_DECISIONS = ["pass", "rewrite", "block"] as const;
export const AUDIT_REVIEWER_ROLES = ["content", "compliance", "product", "legal"] as const;

export const DISCLAIMER_SURFACES = [
  "entry",
  "consent",
  "result",
  "fallback",
  "exit",
  "share_placeholder"
] as const;

export const FALLBACK_REASONS = [
  "camera_denied",
  "model_error",
  "no_face",
  "multi_face",
  "low_light",
  "off_center",
  "loading_timeout",
  "action_timeout",
  "no_card_candidate"
] as const;

export const ANONYMOUS_MVP_EVENT_TYPES = [
  "session_started",
  "consent_viewed",
  "camera_consent_granted",
  "manual_mode_selected",
  "calibration_passed",
  "calibration_failed",
  "fallback_triggered",
  "action_detected",
  "card_drawn",
  "result_viewed",
  "session_exited"
] as const;

export const ContentAuditRecordSchema = z
  .object({
    target_type: z.enum(AUDIT_TARGET_TYPES),
    target_id: z.string().min(1),
    risk_hits: z.array(z.string().min(1)),
    decision: z.enum(AUDIT_DECISIONS),
    reviewer_role: z.enum(AUDIT_REVIEWER_ROLES),
    notes: z.string().min(1),
    reviewed_at: z.string().datetime()
  })
  .strict();

export const SafetyScanReportSchema = z
  .object({
    total_cards: z.number().int().nonnegative(),
    passed_count: z.number().int().nonnegative(),
    blocked_count: z.number().int().nonnegative(),
    rewrite_count: z.number().int().nonnegative(),
    unsafe_ids: z.array(z.string().min(1)),
    risk_hits_by_claim: z.record(z.string(), z.number().int().nonnegative())
  })
  .strict();

export const DisclaimerPolicySchema = z
  .object({
    surface: z.enum(DISCLAIMER_SURFACES),
    required: z.literal(true),
    copy: z.string().min(1),
    review_status: z.enum(["approved", "pending", "blocked"]),
    last_reviewed_at: z.string().datetime()
  })
  .strict();

export const FallbackReasonSchema = z.enum(FALLBACK_REASONS);

export const AnonymousMvpEventSchema = z
  .object({
    event_type: z.enum(ANONYMOUS_MVP_EVENT_TYPES),
    session_step: z.enum(MVP_SESSION_STATES),
    trigger: z.enum(VISION_EVENT_TYPES).optional(),
    card_group: z.enum(CARD_GROUPS).optional(),
    fallback_reason: FallbackReasonSchema.optional(),
    timestamp: z.number().int().nonnegative()
  })
  .strict();

export const Phase4QaReportSchema = z
  .object({
    content_audit_passed: z.boolean(),
    browser_compatibility: z.array(z.string().min(1)).min(1),
    fallback_paths_covered: z.array(FallbackReasonSchema).min(FALLBACK_REASONS.length),
    performance_notes: z.string().min(1),
    go_no_go: z.enum(["go", "hold", "no-go"])
  })
  .strict();

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];
export type AuditDecision = (typeof AUDIT_DECISIONS)[number];
export type AuditReviewerRole = (typeof AUDIT_REVIEWER_ROLES)[number];
export type DisclaimerSurface = (typeof DISCLAIMER_SURFACES)[number];
export type FallbackReason = z.infer<typeof FallbackReasonSchema>;
export type AnonymousMvpEventType = (typeof ANONYMOUS_MVP_EVENT_TYPES)[number];
export type ContentAuditRecord = z.infer<typeof ContentAuditRecordSchema>;
export type SafetyScanReport = z.infer<typeof SafetyScanReportSchema>;
export type DisclaimerPolicy = z.infer<typeof DisclaimerPolicySchema>;
export type AnonymousMvpEvent = z.infer<typeof AnonymousMvpEventSchema>;
export type Phase4QaReport = z.infer<typeof Phase4QaReportSchema>;
