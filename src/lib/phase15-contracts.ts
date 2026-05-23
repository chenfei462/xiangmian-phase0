import { z } from "zod";

import { PHASE5_DECISIONS } from "./phase5-contracts";
import { AdminUserRoleSchema } from "./phase8-contracts";
import { SERVICE_TIERS } from "./phase11-contracts";
import { SLA_REVIEW_STATUSES } from "./phase12-contracts";
import { RENEWAL_INTENTS, SUPPORT_CAPACITY_STATUSES } from "./phase14-contracts";

export const GROWTH_COHORT_STATUSES = ["planned", "active", "paused", "archived", "completed"] as const;
export const CUSTOMER_LIFECYCLE_STATUSES = [
  "admitted",
  "onboarding",
  "first_campaign_ready",
  "stable",
  "risk_watch",
  "paused",
  "archived"
] as const;
export const RETENTION_RISK_LEVELS = ["low", "medium", "high"] as const;
export const PROCUREMENT_STAGES = ["discovery", "procurement", "legal_review", "blocked", "ready"] as const;
export const BACKLOG_URGENCY_LEVELS = ["low", "medium", "high"] as const;
export const PHASE16_RECOMMENDATIONS = [
  "continue_expansion",
  "start_billing_module",
  "start_hardware_discovery"
] as const;

const TenantIdSchema = z.string().regex(/^TEN-\d{3}$/);
const ThemeIdSchema = z.string().regex(/^THEME-[A-Z0-9-]+$/);

export const CustomerGrowthCohortSchema = z
  .object({
    cohort_id: z.string().regex(/^COHORT-\d{3}$/),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    target_customer_count: z.number().int().min(1).max(25),
    tenant_ids: z.array(TenantIdSchema).min(1).max(25),
    growth_policy_id: z.string().regex(/^GROWTH-POLICY-\d{3}$/),
    owner_role: AdminUserRoleSchema,
    status: z.enum(GROWTH_COHORT_STATUSES)
  })
  .strict();

export const CustomerGrowthPolicySchema = z
  .object({
    policy_id: z.string().regex(/^GROWTH-POLICY-\d{3}$/),
    max_customer_count: z.number().int().min(15).max(25),
    required_reviews: z.array(AdminUserRoleSchema).min(1),
    allowed_service_tiers: z.array(z.enum(SERVICE_TIERS)).min(1),
    support_capacity_thresholds: z
      .object({
        min_response_met_rate: z.number().min(0).max(1),
        min_review_completion_rate: z.number().min(0).max(1),
        max_open_incidents: z.number().int().nonnegative(),
        max_projected_load: z.number().min(0)
      })
      .strict(),
    stop_conditions: z.array(z.string().min(1)).min(1),
    review_status: z.enum(SLA_REVIEW_STATUSES)
  })
  .strict();

export const CustomerLifecycleStateSchema = z
  .object({
    tenant_id: TenantIdSchema,
    lifecycle_status: z.enum(CUSTOMER_LIFECYCLE_STATUSES),
    onboarding_completed_at: z.string().datetime().nullable(),
    first_campaign_published_at: z.string().datetime().nullable(),
    last_active_at: z.string().datetime().nullable(),
    pause_reason: z.string().min(1).nullable(),
    archive_reason: z.string().min(1).nullable()
  })
  .strict();

export const GrowthCapacityForecastSchema = z
  .object({
    period: z.string().min(1),
    active_customer_count: z.number().int().nonnegative(),
    support_owner_count: z.number().int().positive(),
    incident_count: z.number().int().nonnegative(),
    open_incident_count: z.number().int().nonnegative(),
    response_met_rate: z.number().min(0).max(1),
    projected_load: z.number().min(0),
    capacity_status: z.enum(SUPPORT_CAPACITY_STATUSES)
  })
  .strict();

export const CustomerRetentionSignalSchema = z
  .object({
    tenant_id: TenantIdSchema,
    review_period: z.string().min(1),
    health_score: z.number().int().min(0).max(100),
    renewal_intent: z.enum(RENEWAL_INTENTS),
    risk_level: z.enum(RETENTION_RISK_LEVELS),
    expansion_opportunity: z.boolean(),
    next_action: z.string().min(1)
  })
  .strict();

export const BillingEvidenceBacklogSchema = z
  .object({
    tenant_id: TenantIdSchema,
    pricing_objection: z.boolean(),
    contract_blockers: z.array(z.string().min(1)),
    requested_terms: z.array(z.string().min(1)),
    procurement_stage: z.enum(PROCUREMENT_STAGES),
    urgency: z.enum(BACKLOG_URGENCY_LEVELS),
    next_action: z.string().min(1),
    review_status: z.enum(SLA_REVIEW_STATUSES)
  })
  .strict();

export const CustomerPortfolioReportSchema = z
  .object({
    customer_count: z.number().int().nonnegative(),
    active_customer_count: z.number().int().nonnegative(),
    cohort_count: z.number().int().nonnegative(),
    onboarding_completion_rate: z.number().min(0).max(1),
    sla_check_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    support_capacity_passed: z.boolean(),
    retention_risk_count: z.number().int().nonnegative()
  })
  .strict();

export const Phase15ExpansionReportSchema = z
  .object({
    customer_count: z.number().int().nonnegative(),
    active_customer_count: z.number().int().nonnegative(),
    growth_check_passed: z.boolean(),
    tenant_isolation_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    support_capacity_passed: z.boolean(),
    billing_evidence_ready: z.boolean(),
    phase16_recommendation: z.enum(PHASE16_RECOMMENDATIONS),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type GrowthCohortStatus = (typeof GROWTH_COHORT_STATUSES)[number];
export type CustomerLifecycleStatus = (typeof CUSTOMER_LIFECYCLE_STATUSES)[number];
export type RetentionRiskLevel = (typeof RETENTION_RISK_LEVELS)[number];
export type ProcurementStage = (typeof PROCUREMENT_STAGES)[number];
export type BacklogUrgencyLevel = (typeof BACKLOG_URGENCY_LEVELS)[number];
export type Phase16Recommendation = (typeof PHASE16_RECOMMENDATIONS)[number];
export type CustomerGrowthCohort = z.infer<typeof CustomerGrowthCohortSchema>;
export type CustomerGrowthPolicy = z.infer<typeof CustomerGrowthPolicySchema>;
export type CustomerLifecycleState = z.infer<typeof CustomerLifecycleStateSchema>;
export type GrowthCapacityForecast = z.infer<typeof GrowthCapacityForecastSchema>;
export type CustomerRetentionSignal = z.infer<typeof CustomerRetentionSignalSchema>;
export type BillingEvidenceBacklog = z.infer<typeof BillingEvidenceBacklogSchema>;
export type CustomerPortfolioReport = z.infer<typeof CustomerPortfolioReportSchema>;
export type Phase15ExpansionReport = z.infer<typeof Phase15ExpansionReportSchema>;
