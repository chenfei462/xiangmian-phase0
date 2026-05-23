import { z } from "zod";

import { VISION_EVENT_TYPES } from "./contracts";
import { FallbackReasonSchema } from "./phase4-contracts";

export const GRAY_SURFACES = ["desktop_chrome", "android_chrome", "ios_safari"] as const;
export const GRAY_DEVICE_TYPES = ["desktop", "android", "ios"] as const;
export const SHARE_INTENTS = ["yes", "no", "maybe"] as const;
export const PHASE5_DECISIONS = ["go", "hold", "no-go"] as const;
export const GRAY_REVIEWER_ROLES = ["content", "compliance", "product", "legal"] as const;

export const GoNoGoThresholdsSchema = z
  .object({
    completion_rate: z.number().min(0).max(1),
    manual_completion_rate: z.number().min(0).max(1),
    action_success_rate: z.number().min(0).max(1),
    result_reach_rate: z.number().min(0).max(1),
    negative_feedback_rate: z.number().min(0).max(1)
  })
  .strict();

export const GrayTestBatchSchema = z
  .object({
    batch_id: z.string().regex(/^GRAY-\d{3}$/),
    version: z.string().min(1),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    target_sample_size: z.number().int().min(1),
    allowed_surfaces: z.array(z.enum(GRAY_SURFACES)).min(1),
    goals: z.array(z.string().min(1)).min(1),
    go_no_go_thresholds: GoNoGoThresholdsSchema
  })
  .strict();

export const GraySessionSummarySchema = z
  .object({
    session_id: z.string().regex(/^GS-\d{3}$/),
    batch_id: z.string().regex(/^GRAY-\d{3}$/),
    completed: z.boolean(),
    manual_mode_used: z.boolean(),
    result_reached: z.boolean(),
    duration_ms: z.number().int().nonnegative(),
    fallback_reasons: z.array(FallbackReasonSchema),
    event_count: z.number().int().nonnegative()
  })
  .strict();

export const GrayFeedbackRecordSchema = z
  .object({
    feedback_id: z.string().regex(/^FB-\d{3}$/),
    batch_id: z.string().regex(/^GRAY-\d{3}$/),
    device_type: z.enum(GRAY_DEVICE_TYPES),
    browser: z.string().min(1),
    completion_rating: z.number().int().min(1).max(5),
    copy_safety_rating: z.number().int().min(1).max(5),
    share_intent: z.enum(SHARE_INTENTS),
    issue_tags: z.array(z.string().min(1)),
    notes: z.string()
  })
  .strict();

export const TopFallbackReasonSchema = z
  .object({
    reason: FallbackReasonSchema,
    count: z.number().int().positive()
  })
  .strict();

export const GrayMetricsReportSchema = z
  .object({
    sample_size: z.number().int().nonnegative(),
    completion_rate: z.number().min(0).max(1),
    manual_completion_rate: z.number().min(0).max(1),
    action_success_rate: z.number().min(0).max(1),
    result_reach_rate: z.number().min(0).max(1),
    share_intent_rate: z.number().min(0).max(1),
    negative_feedback_rate: z.number().min(0).max(1),
    top_fallback_reasons: z.array(TopFallbackReasonSchema)
  })
  .strict();

export const CardBlocklistSchema = z
  .object({
    card_id: z.string().regex(/^CARD-KB-\d{3}$/),
    reason: z.string().min(1),
    blocked_at: z.string().datetime(),
    reviewer_role: z.enum(GRAY_REVIEWER_ROLES),
    notes: z.string().min(1)
  })
  .strict();

export const Phase5GoNoGoSchema = z
  .object({
    decision: z.enum(PHASE5_DECISIONS),
    blocking_issues: z.array(z.string().min(1)),
    required_fixes: z.array(z.string().min(1)),
    phase6_recommendation: z.string().min(1)
  })
  .strict();

export type GraySurface = (typeof GRAY_SURFACES)[number];
export type GrayDeviceType = (typeof GRAY_DEVICE_TYPES)[number];
export type ShareIntent = (typeof SHARE_INTENTS)[number];
export type Phase5Decision = (typeof PHASE5_DECISIONS)[number];
export type GoNoGoThresholds = z.infer<typeof GoNoGoThresholdsSchema>;
export type GrayTestBatch = z.infer<typeof GrayTestBatchSchema>;
export type GraySessionSummary = z.infer<typeof GraySessionSummarySchema>;
export type GrayFeedbackRecord = z.infer<typeof GrayFeedbackRecordSchema>;
export type TopFallbackReason = z.infer<typeof TopFallbackReasonSchema>;
export type GrayMetricsReport = z.infer<typeof GrayMetricsReportSchema>;
export type CardBlocklist = z.infer<typeof CardBlocklistSchema>;
export type Phase5GoNoGo = z.infer<typeof Phase5GoNoGoSchema>;
