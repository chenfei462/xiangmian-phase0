import { z } from "zod";

import { PHASE5_DECISIONS, CardBlocklistSchema } from "./phase5-contracts";
import { ReleaseGateSchema } from "./phase6-contracts";
import {
  CampaignConfigV02Schema,
  ScenarioConfigSchema,
  ThemePackV02Schema,
  VenueActivationSchema
} from "./phase7-contracts";

export const ADMIN_USER_ROLES = [
  "product",
  "content",
  "compliance",
  "legal",
  "operations",
  "engineering",
  "viewer"
] as const;

export const CONFIG_VERSION_STATUSES = ["draft", "review", "published", "archived"] as const;
export const ADMIN_TARGET_TYPES = [
  "theme",
  "campaign",
  "scenario",
  "venue_activation",
  "card_blocklist",
  "release_gate",
  "metrics",
  "config_version"
] as const;
export const ADMIN_ACTION_TYPES = [
  "create",
  "update",
  "block",
  "unblock",
  "publish",
  "archive",
  "import",
  "export",
  "review"
] as const;
export const ADMIN_DRAFT_OPERATIONS = ["create", "update", "block", "unblock", "publish", "archive"] as const;
export const ADMIN_VALIDATION_STATUSES = ["pending", "valid", "invalid"] as const;
export const EDITABLE_ADMIN_SURFACES = [
  "campaign",
  "card_blocklist",
  "release_gate",
  "metrics",
  "config_version"
] as const;

export const AdminUserRoleSchema = z.enum(ADMIN_USER_ROLES);

export const AdminActorSchema = z
  .object({
    actor_id: z.string().regex(/^ADM-\d{3}$/),
    role: AdminUserRoleSchema,
    display_name: z.string().min(1)
  })
  .strict();

export const ConfigVersionSchema = z
  .object({
    version_id: z.string().regex(/^CFG-\d{3}$/),
    source_registry_version: z.string().min(1),
    status: z.enum(CONFIG_VERSION_STATUSES),
    created_at: z.string().datetime(),
    published_at: z.string().datetime().nullable(),
    owner_role: AdminUserRoleSchema,
    change_summary: z.string().min(1)
  })
  .strict();

export const AdminActionSchema = z
  .object({
    action_id: z.string().regex(/^ACTN-\d{3}$/),
    actor_role: AdminUserRoleSchema,
    action_type: z.enum(ADMIN_ACTION_TYPES),
    target_type: z.enum(ADMIN_TARGET_TYPES),
    target_id: z.string().min(1),
    before: z.unknown().nullable(),
    after: z.unknown().nullable(),
    reason: z.string().min(1),
    created_at: z.string().datetime()
  })
  .strict();

export const AdminDraftChangeSchema = z
  .object({
    draft_id: z.string().regex(/^DRF-\d{3}$/),
    target_type: z.enum(ADMIN_TARGET_TYPES),
    target_id: z.string().min(1),
    operation: z.enum(ADMIN_DRAFT_OPERATIONS),
    validation_status: z.enum(ADMIN_VALIDATION_STATUSES),
    risk_hits: z.array(z.string().min(1))
  })
  .strict();

export const AdminMetricsSnapshotSchema = z
  .object({
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    completion_rate: z.number().min(0).max(1),
    manual_completion_rate: z.number().min(0).max(1),
    action_success_rate: z.number().min(0).max(1),
    poster_generation_rate: z.number().min(0).max(1),
    share_click_rate: z.number().min(0).max(1),
    negative_feedback_count: z.number().int().nonnegative(),
    updated_at: z.string().datetime()
  })
  .strict();

export const AdminConfigStoreSchema = z
  .object({
    themes: z.array(ThemePackV02Schema).min(1),
    campaigns: z.array(CampaignConfigV02Schema).min(1),
    scenarios: z.array(ScenarioConfigSchema).min(1),
    venue_activations: z.array(VenueActivationSchema),
    card_blocklist: z.array(CardBlocklistSchema),
    release_gates: z.array(ReleaseGateSchema).min(1),
    metrics_fixtures: z.array(AdminMetricsSnapshotSchema),
    audit_logs: z.array(AdminActionSchema)
  })
  .strict();

export const Phase8AdminReportSchema = z
  .object({
    config_version_id: z.string().regex(/^CFG-\d{3}$/),
    editable_surfaces: z.array(z.enum(EDITABLE_ADMIN_SURFACES)).min(1),
    audit_count: z.number().int().nonnegative(),
    blocked_card_count: z.number().int().nonnegative(),
    published_campaign_count: z.number().int().nonnegative(),
    privacy_check_passed: z.boolean(),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type AdminUserRole = z.infer<typeof AdminUserRoleSchema>;
export type AdminActor = z.infer<typeof AdminActorSchema>;
export type ConfigVersion = z.infer<typeof ConfigVersionSchema>;
export type AdminAction = z.infer<typeof AdminActionSchema>;
export type AdminDraftChange = z.infer<typeof AdminDraftChangeSchema>;
export type AdminMetricsSnapshot = z.infer<typeof AdminMetricsSnapshotSchema>;
export type AdminConfigStore = z.infer<typeof AdminConfigStoreSchema>;
export type Phase8AdminReport = z.infer<typeof Phase8AdminReportSchema>;
