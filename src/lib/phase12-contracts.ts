import { z } from "zod";

import { PHASE5_DECISIONS } from "./phase5-contracts";
import { AdminUserRoleSchema } from "./phase8-contracts";
import { SERVICE_TIERS, SUPPORT_SEVERITIES } from "./phase11-contracts";

export const EXPANSION_BATCH_STATUSES = ["planned", "active", "paused", "completed"] as const;
export const ENTITLEMENT_STATUSES = ["active", "paused", "suspended", "archived"] as const;
export const SLA_SUPPORT_CHANNELS = ["email", "shared_chat", "phone_bridge"] as const;
export const SLA_REVIEW_STATUSES = ["draft", "approved", "blocked"] as const;
export const CUSTOMER_HEALTH_STATUSES = ["healthy", "watch", "blocked"] as const;
export const CUSTOMER_RESOURCE_TYPES = [
  "activity",
  "snapshot",
  "export_package",
  "metrics",
  "audit",
  "support_record",
  "customer_report"
] as const;

const TenantIdSchema = z.string().regex(/^TEN-\d{3}$/);
const CampaignIdSchema = z.string().regex(/^CMP-\d{3}$/);
const ThemeIdSchema = z.string().regex(/^THEME-[A-Z0-9-]+$/);

export const CustomerExpansionBatchSchema = z
  .object({
    batch_id: z.string().regex(/^EXP-\d{3}$/),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    target_customer_count: z.number().int().min(3).max(5),
    eligible_tenant_ids: z.array(TenantIdSchema).min(3).max(5),
    success_metrics: z
      .object({
        min_active_customer_count: z.number().int().min(3).max(5),
        min_completion_rate: z.number().min(0).max(1),
        max_negative_feedback_count: z.number().int().nonnegative(),
        privacy_complaint_target: z.number().int().nonnegative()
      })
      .strict(),
    status: z.enum(EXPANSION_BATCH_STATUSES)
  })
  .strict();

export const TenantEntitlementSchema = z
  .object({
    tenant_id: TenantIdSchema,
    service_tier: z.enum(SERVICE_TIERS),
    allowed_campaign_count: z.number().int().positive(),
    allowed_theme_ids: z.array(ThemeIdSchema).min(1),
    export_enabled: z.boolean(),
    sla_policy_id: z.string().regex(/^SLA-\d{3}$/),
    status: z.enum(ENTITLEMENT_STATUSES)
  })
  .strict();

export const CustomerSlaPolicySchema = z
  .object({
    sla_policy_id: z.string().regex(/^SLA-\d{3}$/),
    tier: z.enum(SERVICE_TIERS),
    response_target_hours: z.number().int().positive(),
    incident_escalation_hours: z.number().int().positive(),
    support_channel: z.enum(SLA_SUPPORT_CHANNELS),
    review_status: z.enum(SLA_REVIEW_STATUSES)
  })
  .strict();

export const CustomerHealthScoreSchema = z
  .object({
    tenant_id: TenantIdSchema,
    score: z.number().int().min(0).max(100),
    status: z.enum(CUSTOMER_HEALTH_STATUSES),
    risk_flags: z.array(z.string().min(1)),
    last_activity_at: z.string().datetime(),
    last_reviewed_at: z.string().datetime()
  })
  .strict();

export const CommercialCustomerReportSchema = z
  .object({
    tenant_id: TenantIdSchema,
    campaign_count: z.number().int().nonnegative(),
    published_snapshot_count: z.number().int().nonnegative(),
    completion_rate: z.number().min(0).max(1),
    manual_completion_rate: z.number().min(0).max(1),
    negative_feedback_count: z.number().int().nonnegative(),
    support_incident_count: z.number().int().nonnegative(),
    privacy_check_passed: z.boolean(),
    generated_at: z.string().datetime()
  })
  .strict();

export const CustomerSupportRunbookSchema = z
  .object({
    runbook_id: z.string().regex(/^RUN-\d{3}$/),
    scenario: z.string().min(1),
    severity: z.enum(SUPPORT_SEVERITIES),
    owner_role: AdminUserRoleSchema,
    steps: z.array(z.string().min(1)).min(1),
    rollback_required: z.boolean(),
    review_status: z.enum(SLA_REVIEW_STATUSES)
  })
  .strict();

export const CustomerSuccessReviewSchema = z
  .object({
    tenant_id: TenantIdSchema,
    review_period: z.string().min(1),
    health_score: z.number().int().min(0).max(100),
    blocking_issues: z.array(z.string().min(1)),
    recommended_actions: z.array(z.string().min(1)),
    next_review_at: z.string().datetime()
  })
  .strict();

export const Phase12ExpansionReportSchema = z
  .object({
    customer_count: z.number().int().nonnegative(),
    active_customer_count: z.number().int().nonnegative(),
    sla_check_passed: z.boolean(),
    tenant_isolation_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    support_readiness_passed: z.boolean(),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type ExpansionBatchStatus = (typeof EXPANSION_BATCH_STATUSES)[number];
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];
export type SlaSupportChannel = (typeof SLA_SUPPORT_CHANNELS)[number];
export type SlaReviewStatus = (typeof SLA_REVIEW_STATUSES)[number];
export type CustomerHealthStatus = (typeof CUSTOMER_HEALTH_STATUSES)[number];
export type CustomerResourceType = (typeof CUSTOMER_RESOURCE_TYPES)[number];
export type CustomerExpansionBatch = z.infer<typeof CustomerExpansionBatchSchema>;
export type TenantEntitlement = z.infer<typeof TenantEntitlementSchema>;
export type CustomerSlaPolicy = z.infer<typeof CustomerSlaPolicySchema>;
export type CustomerHealthScore = z.infer<typeof CustomerHealthScoreSchema>;
export type CommercialCustomerReport = z.infer<typeof CommercialCustomerReportSchema>;
export type CustomerSupportRunbook = z.infer<typeof CustomerSupportRunbookSchema>;
export type CustomerSuccessReview = z.infer<typeof CustomerSuccessReviewSchema>;
export type Phase12ExpansionReport = z.infer<typeof Phase12ExpansionReportSchema>;
