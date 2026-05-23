import { z } from "zod";

import { CARD_GROUPS } from "./knowledge-contracts";
import {
  CampaignConfigSchema,
  ThemePackSchema,
  CAMPAIGN_SURFACES,
  PHASE6_OWNER_ROLES
} from "./phase6-contracts";
import { PHASE5_DECISIONS } from "./phase5-contracts";

export const VENUE_TYPES = ["线上H5", "文旅展陈", "国风市集", "品牌联名"] as const;

export const CampaignConfigV02Schema = CampaignConfigSchema.extend({
  scenario_id: z.string().regex(/^SCN-\d{3}$/),
  display_name: z.string().min(1),
  entry_qr_target: z.string().url(),
  venue_notice_required: z.boolean(),
  operator_contact: z.string().min(1)
}).strict();

export const ThemePackV02Schema = ThemePackSchema.extend({
  scenario_fit: z.array(z.string().min(1)).min(1),
  visual_motif: z.string().min(1),
  recommended_surfaces: z.array(z.enum(CAMPAIGN_SURFACES)).min(1),
  forbidden_claims: z.array(z.string().min(1)).min(1)
}).strict();

export const ScenarioConfigSchema = z
  .object({
    scenario_id: z.string().regex(/^SCN-\d{3}$/),
    name: z.string().min(1),
    audience: z.string().min(1),
    surface: z.enum(CAMPAIGN_SURFACES),
    venue_type: z.enum(VENUE_TYPES),
    privacy_notice: z.string().min(1),
    default_theme_id: z.string().regex(/^THEME-[A-Z0-9-]+$/),
    enabled_campaign_ids: z.array(z.string().regex(/^CMP-\d{3}$/)).min(1)
  })
  .strict();

export const VenueActivationSchema = z
  .object({
    activation_id: z.string().regex(/^ACT-\d{3}$/),
    scenario_id: z.string().regex(/^SCN-\d{3}$/),
    venue_name: z.string().min(1),
    city: z.string().min(1),
    start_at: z.string().datetime(),
    end_at: z.string().datetime(),
    qr_target: z.string().url(),
    onsite_notice_copy: z.string().min(1),
    staff_sop_id: z.string().regex(/^SOP-[A-Z0-9-]+$/)
  })
  .strict();

export const Phase7ReuseReportSchema = z
  .object({
    scenario_id: z.string().regex(/^SCN-\d{3}$/),
    theme_id: z.string().regex(/^THEME-[A-Z0-9-]+$/),
    campaign_count: z.number().int().nonnegative(),
    publishable_card_count: z.number().int().nonnegative(),
    poster_template_ready: z.boolean(),
    privacy_ready: z.boolean(),
    content_review_ready: z.boolean(),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export const ThemeRegistrySchema = z
  .object({
    default_campaign_id: z.string().regex(/^CMP-\d{3}$/),
    themes: z.array(ThemePackV02Schema).min(2),
    campaigns: z.array(CampaignConfigV02Schema).min(2),
    scenarios: z.array(ScenarioConfigSchema).min(1),
    owner_roles: z.array(z.enum(PHASE6_OWNER_ROLES)).min(1),
    preferred_card_groups: z.array(z.enum(CARD_GROUPS)).min(1)
  })
  .strict();

export type VenueType = (typeof VENUE_TYPES)[number];
export type CampaignConfigV02 = z.infer<typeof CampaignConfigV02Schema>;
export type ThemePackV02 = z.infer<typeof ThemePackV02Schema>;
export type ScenarioConfig = z.infer<typeof ScenarioConfigSchema>;
export type ThemeRegistry = z.infer<typeof ThemeRegistrySchema>;
export type VenueActivation = z.infer<typeof VenueActivationSchema>;
export type Phase7ReuseReport = z.infer<typeof Phase7ReuseReportSchema>;
