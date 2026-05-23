import { z } from "zod";

import { VISION_EVENT_TYPES } from "./contracts";
import { CARD_GROUPS } from "./knowledge-contracts";
import { MVP_SESSION_STATES } from "./mvp-contracts";
import { FallbackReasonSchema } from "./phase4-contracts";
import { PHASE5_DECISIONS, CardBlocklistSchema } from "./phase5-contracts";
import {
  PUBLIC_ANONYMOUS_EVENT_TYPES,
  PUBLIC_DURATION_BUCKETS
} from "./phase6-contracts";
import {
  CampaignConfigV02Schema,
  ThemePackV02Schema
} from "./phase7-contracts";
import {
  ADMIN_TARGET_TYPES,
  AdminUserRoleSchema,
  ConfigVersionSchema
} from "./phase8-contracts";

export const TENANT_TYPES = ["internal", "client_demo", "partner"] as const;
export const TENANT_STATUSES = ["active", "paused", "archived"] as const;
export const ADMIN_ACCOUNT_STATUSES = ["invited", "active", "disabled"] as const;
export const SAAS_ADMIN_ACTIONS = [
  "config:read",
  "config:save_draft",
  "config:submit_review",
  "config:publish",
  "config:rollback",
  "blocklist:block",
  "blocklist:unblock",
  "release_gate:review",
  "campaign:update",
  "metrics:read",
  "snapshot:export",
  "audit:read"
] as const;
export const SAAS_TARGET_TYPES = [
  ...ADMIN_TARGET_TYPES,
  "tenant",
  "admin_account",
  "published_snapshot"
] as const;

const HashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const TenantWorkspaceSchema = z
  .object({
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    name: z.string().min(1),
    tenant_type: z.enum(TENANT_TYPES),
    status: z.enum(TENANT_STATUSES),
    allowed_scenarios: z.array(z.string().regex(/^SCN-\d{3}$/)).min(1),
    created_at: z.string().datetime()
  })
  .strict();

export const AdminAccountSchema = z
  .object({
    admin_id: z.string().regex(/^ADM-\d{3}$/),
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    email: z.string().email(),
    display_name: z.string().min(1),
    role: AdminUserRoleSchema,
    status: z.enum(ADMIN_ACCOUNT_STATUSES),
    last_login_at: z.string().datetime().nullable()
  })
  .strict();

export const PermissionPolicySchema = z
  .object({
    role: AdminUserRoleSchema,
    allowed_actions: z.array(z.enum(SAAS_ADMIN_ACTIONS)).min(1),
    blocked_actions: z.array(z.enum(SAAS_ADMIN_ACTIONS)),
    requires_review: z.array(z.enum(SAAS_ADMIN_ACTIONS))
  })
  .strict();

export const ConfigVersionV02Schema = ConfigVersionSchema.extend({
  tenant_id: z.string().regex(/^TEN-\d{3}$/),
  parent_version_id: z.string().regex(/^CFG-\d{3}$/).nullable(),
  checksum: HashSchema,
  published_by: z.string().regex(/^ADM-\d{3}$/).nullable(),
  rollback_of: z.string().regex(/^CFG-\d{3}$/).nullable()
}).strict();

export const SaasAuditLogSchema = z
  .object({
    audit_id: z.string().regex(/^AUD-\d{3}$/),
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    actor_admin_id: z.string().regex(/^ADM-\d{3}$/),
    actor_role: AdminUserRoleSchema,
    action_type: z.enum(SAAS_ADMIN_ACTIONS),
    target_type: z.enum(SAAS_TARGET_TYPES),
    target_id: z.string().min(1),
    before_hash: HashSchema.nullable(),
    after_hash: HashSchema.nullable(),
    reason: z.string().min(1),
    created_at: z.string().datetime()
  })
  .strict();

export const PublishedConfigSnapshotSchema = z
  .object({
    snapshot_id: z.string().regex(/^SNP-\d{3}$/),
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    config_version_id: z.string().regex(/^CFG-\d{3}$/),
    campaign: CampaignConfigV02Schema,
    theme: ThemePackV02Schema,
    blocklist: z.array(CardBlocklistSchema),
    generated_at: z.string().datetime()
  })
  .strict();

export const AnonymousMetricsEventV02Schema = z
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

export const Phase9SaasReportSchema = z
  .object({
    tenant_count: z.number().int().nonnegative(),
    published_snapshot_count: z.number().int().nonnegative(),
    audit_count: z.number().int().nonnegative(),
    permission_check_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    migration_check_passed: z.boolean(),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type TenantType = (typeof TENANT_TYPES)[number];
export type TenantStatus = (typeof TENANT_STATUSES)[number];
export type AdminAccountStatus = (typeof ADMIN_ACCOUNT_STATUSES)[number];
export type SaasAdminAction = (typeof SAAS_ADMIN_ACTIONS)[number];
export type SaasTargetType = (typeof SAAS_TARGET_TYPES)[number];
export type TenantWorkspace = z.infer<typeof TenantWorkspaceSchema>;
export type AdminAccount = z.infer<typeof AdminAccountSchema>;
export type PermissionPolicy = z.infer<typeof PermissionPolicySchema>;
export type ConfigVersionV02 = z.infer<typeof ConfigVersionV02Schema>;
export type SaasAuditLog = z.infer<typeof SaasAuditLogSchema>;
export type PublishedConfigSnapshot = z.infer<typeof PublishedConfigSnapshotSchema>;
export type AnonymousMetricsEventV02 = z.infer<typeof AnonymousMetricsEventV02Schema>;
export type Phase9SaasReport = z.infer<typeof Phase9SaasReportSchema>;

export type ConfigRepository = {
  loadDraft: (tenantId: string) => import("./phase8-contracts").AdminConfigStore | null;
  saveDraft: (
    tenantId: string,
    store: import("./phase8-contracts").AdminConfigStore,
    actorAdminId: string,
    reason: string
  ) => import("./phase8-contracts").AdminConfigStore;
  submitReview: (tenantId: string, actorAdminId: string, reason: string) => ConfigVersionV02;
  publish: (
    tenantId: string,
    actorAdminId: string,
    campaignId: string,
    reason: string
  ) => PublishedConfigSnapshot;
  rollback: (
    tenantId: string,
    actorAdminId: string,
    snapshotId: string,
    reason: string
  ) => PublishedConfigSnapshot;
  exportSnapshot: (tenantId: string, campaignId: string) => PublishedConfigSnapshot | null;
};
