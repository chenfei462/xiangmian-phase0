import { z } from "zod";

import { PHASE5_DECISIONS } from "./phase5-contracts";
import { AdminUserRoleSchema } from "./phase8-contracts";
import { CHECKLIST_ITEM_STATUSES } from "./phase11-contracts";
import { CUSTOMER_HEALTH_STATUSES } from "./phase12-contracts";

export const SCALE_BATCH_STATUSES = ["planned", "active", "paused", "completed"] as const;
export const SCALE_GATE_STATUSES = ["pending", "pass", "blocked"] as const;

const TenantIdSchema = z.string().regex(/^TEN-\d{3}$/);

export const CustomerScaleBatchSchema = z
  .object({
    batch_id: z.string().regex(/^SCALE-\d{3}$/),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    target_customer_count: z.number().int().min(1).max(10),
    tenant_ids: z.array(TenantIdSchema).min(1).max(10),
    owner_role: AdminUserRoleSchema,
    success_metrics: z
      .object({
        min_active_customer_count: z.number().int().min(1).max(10),
        min_completion_rate: z.number().min(0).max(1),
        min_sla_response_met_rate: z.number().min(0).max(1),
        max_negative_feedback_count: z.number().int().nonnegative(),
        privacy_complaint_target: z.number().int().nonnegative()
      })
      .strict(),
    status: z.enum(SCALE_BATCH_STATUSES)
  })
  .strict();

export const CustomerOnboardingRunSchema = z
  .object({
    tenant_id: TenantIdSchema,
    batch_id: z.string().regex(/^SCALE-\d{3}$/),
    checklist_status: z.enum(CHECKLIST_ITEM_STATUSES),
    theme_authorized: z.boolean(),
    privacy_review_passed: z.boolean(),
    legal_review_passed: z.boolean(),
    first_campaign_ready: z.boolean(),
    completed_at: z.string().datetime().nullable()
  })
  .strict();

export const CustomerHealthTrendSchema = z
  .object({
    tenant_id: TenantIdSchema,
    week: z.string().regex(/^\d{4}-W\d{2}$/),
    score: z.number().int().min(0).max(100),
    status: z.enum(CUSTOMER_HEALTH_STATUSES),
    risk_flags: z.array(z.string().min(1)),
    sla_miss_count: z.number().int().nonnegative(),
    support_incident_count: z.number().int().nonnegative(),
    recommended_actions: z.array(z.string().min(1))
  })
  .strict();

export const SlaPerformanceSummarySchema = z
  .object({
    tenant_id: TenantIdSchema,
    sla_policy_id: z.string().regex(/^SLA-\d{3}$/),
    response_met_rate: z.number().min(0).max(1),
    escalation_count: z.number().int().nonnegative(),
    open_incident_count: z.number().int().nonnegative(),
    review_completion_rate: z.number().min(0).max(1),
    generated_at: z.string().datetime()
  })
  .strict();

export const CustomerReportPackageSchema = z
  .object({
    tenant_id: TenantIdSchema,
    report_id: z.string().regex(/^RPT-\d{3}$/),
    metrics_summary_id: z.string().regex(/^METRICS-\d{3}$/),
    privacy_scan_id: z.string().regex(/^PRIVACY-\d{3}$/),
    audit_summary_id: z.string().regex(/^AUDIT-SUMMARY-\d{3}$/),
    support_summary_id: z.string().regex(/^SUPPORT-SUMMARY-\d{3}$/),
    generated_at: z.string().datetime()
  })
  .strict();

export const ScaleReadinessGateSchema = z
  .object({
    gate_id: z.string().regex(/^SCALE-GATE-\d{3}$/),
    item: z.string().min(1),
    owner_role: AdminUserRoleSchema,
    status: z.enum(SCALE_GATE_STATUSES),
    evidence: z.string().min(1),
    blocker_reason: z.string().nullable(),
    reviewed_at: z.string().datetime()
  })
  .strict();

export const Phase13ScaleReportSchema = z
  .object({
    customer_count: z.number().int().nonnegative(),
    active_customer_count: z.number().int().nonnegative(),
    batch_count: z.number().int().nonnegative(),
    onboarding_check_passed: z.boolean(),
    sla_check_passed: z.boolean(),
    tenant_isolation_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    support_load_acceptable: z.boolean(),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type ScaleBatchStatus = (typeof SCALE_BATCH_STATUSES)[number];
export type ScaleGateStatus = (typeof SCALE_GATE_STATUSES)[number];
export type CustomerScaleBatch = z.infer<typeof CustomerScaleBatchSchema>;
export type CustomerOnboardingRun = z.infer<typeof CustomerOnboardingRunSchema>;
export type CustomerHealthTrend = z.infer<typeof CustomerHealthTrendSchema>;
export type SlaPerformanceSummary = z.infer<typeof SlaPerformanceSummarySchema>;
export type CustomerReportPackage = z.infer<typeof CustomerReportPackageSchema>;
export type ScaleReadinessGate = z.infer<typeof ScaleReadinessGateSchema>;
export type Phase13ScaleReport = z.infer<typeof Phase13ScaleReportSchema>;
