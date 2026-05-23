import { z } from "zod";

import { VISION_EVENT_TYPES } from "./contracts";
import { CARD_GROUPS } from "./knowledge-contracts";
import { MVP_SESSION_STATES, RESULT_TONES } from "./mvp-contracts";
import { FallbackReasonSchema } from "./phase4-contracts";
import { PHASE5_DECISIONS } from "./phase5-contracts";

export const CAMPAIGN_SURFACES = ["web_h5", "onsite_exhibition", "brand_popup"] as const;
export const CAMPAIGN_RELEASE_STATUSES = ["draft", "ready", "live", "paused", "archived"] as const;
export const RELEASE_GATE_STATUSES = ["pending", "pass", "blocked"] as const;
export const PHASE6_OWNER_ROLES = [
  "product",
  "content",
  "compliance",
  "legal",
  "engineering",
  "operations"
] as const;
export const PUBLIC_DURATION_BUCKETS = ["under_30s", "30_90s", "over_90s"] as const;
export const PUBLIC_ANONYMOUS_EVENT_TYPES = [
  "campaign_viewed",
  "camera_consent_granted",
  "manual_mode_selected",
  "fallback_triggered",
  "action_detected",
  "card_drawn",
  "poster_generated",
  "share_clicked",
  "feedback_opened",
  "session_exited"
] as const;

export const CampaignMetricsTargetsSchema = z
  .object({
    completion_rate: z.number().min(0).max(1),
    manual_completion_rate: z.number().min(0).max(1),
    action_success_rate: z.number().min(0).max(1),
    poster_generation_rate: z.number().min(0).max(1),
    share_click_rate: z.number().min(0).max(1),
    negative_feedback_count: z.number().int().nonnegative()
  })
  .strict();

export const CampaignConfigSchema = z
  .object({
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    theme_id: z.string().regex(/^THEME-[A-Z0-9-]+$/),
    surface: z.enum(CAMPAIGN_SURFACES),
    version: z.string().min(1),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    enabled_triggers: z.array(z.enum(VISION_EVENT_TYPES)).min(1),
    card_pool_ids: z.array(z.string().regex(/^CARD-KB-\d{3}$/)).min(1),
    blocked_card_ids: z.array(z.string().regex(/^CARD-KB-\d{3}$/)),
    feedback_url: z.string().url(),
    metrics_targets: CampaignMetricsTargetsSchema,
    release_status: z.enum(CAMPAIGN_RELEASE_STATUSES)
  })
  .strict();

export const ThemePackSchema = z
  .object({
    theme_id: z.string().regex(/^THEME-[A-Z0-9-]+$/),
    name: z.string().min(1),
    safe_positioning: z.string().min(1),
    copy_tone: z.string().min(1),
    allowed_card_groups: z.array(z.enum(CARD_GROUPS)).min(1),
    result_templates: z.array(z.string().min(1)).min(1),
    poster_template_id: z.string().regex(/^POSTER-[A-Z0-9-]+$/),
    disclaimer_policy_id: z.string().regex(/^DISCLAIMER-[A-Z0-9-]+$/),
    review_status: z.enum(["pending", "approved", "blocked"])
  })
  .strict();

export const ReleaseGateSchema = z
  .object({
    gate_id: z.string().regex(/^GATE-\d{3}$/),
    item: z.string().min(1),
    owner_role: z.enum(PHASE6_OWNER_ROLES),
    status: z.enum(RELEASE_GATE_STATUSES),
    evidence: z.string().min(1),
    blocker_reason: z.string().min(1).nullable(),
    reviewed_at: z.string().datetime()
  })
  .strict();

export const PublicAnonymousEventSchema = z
  .object({
    event_type: z.enum(PUBLIC_ANONYMOUS_EVENT_TYPES),
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    session_step: z.enum(MVP_SESSION_STATES),
    trigger: z.enum(VISION_EVENT_TYPES).optional(),
    card_group: z.enum(CARD_GROUPS).optional(),
    fallback_reason: FallbackReasonSchema.optional(),
    duration_bucket: z.enum(PUBLIC_DURATION_BUCKETS),
    timestamp: z.number().int().nonnegative()
  })
  .strict();

export const PosterRenderRequestSchema = z
  .object({
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    card_id: z.string().regex(/^CARD-KB-\d{3}$/),
    theme_id: z.string().regex(/^THEME-[A-Z0-9-]+$/),
    result_tone: z.enum(RESULT_TONES),
    qr_target: z.string().url(),
    disclaimer_required: z.literal(true)
  })
  .strict();

export const Phase6LaunchReportSchema = z
  .object({
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    sample_size: z.number().int().nonnegative(),
    completion_rate: z.number().min(0).max(1),
    manual_completion_rate: z.number().min(0).max(1),
    action_success_rate: z.number().min(0).max(1),
    poster_generation_rate: z.number().min(0).max(1),
    share_click_rate: z.number().min(0).max(1),
    negative_feedback_count: z.number().int().nonnegative(),
    blocked_cards: z.array(z.string().regex(/^CARD-KB-\d{3}$/)),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type CampaignSurface = (typeof CAMPAIGN_SURFACES)[number];
export type CampaignReleaseStatus = (typeof CAMPAIGN_RELEASE_STATUSES)[number];
export type ReleaseGateStatus = (typeof RELEASE_GATE_STATUSES)[number];
export type Phase6OwnerRole = (typeof PHASE6_OWNER_ROLES)[number];
export type PublicDurationBucket = (typeof PUBLIC_DURATION_BUCKETS)[number];
export type PublicAnonymousEventType = (typeof PUBLIC_ANONYMOUS_EVENT_TYPES)[number];
export type CampaignMetricsTargets = z.infer<typeof CampaignMetricsTargetsSchema>;
export type CampaignConfig = z.infer<typeof CampaignConfigSchema>;
export type ThemePack = z.infer<typeof ThemePackSchema>;
export type ReleaseGate = z.infer<typeof ReleaseGateSchema>;
export type PublicAnonymousEvent = z.infer<typeof PublicAnonymousEventSchema>;
export type PosterRenderRequest = z.infer<typeof PosterRenderRequestSchema>;
export type Phase6LaunchReport = z.infer<typeof Phase6LaunchReportSchema>;
