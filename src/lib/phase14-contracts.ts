import { z } from "zod";

import { PHASE5_DECISIONS } from "./phase5-contracts";
import { AdminUserRoleSchema } from "./phase8-contracts";
import { SERVICE_TIERS } from "./phase11-contracts";
import { ENTITLEMENT_STATUSES, SLA_REVIEW_STATUSES } from "./phase12-contracts";

export const SCALE_WAVE_STATUSES = ["planned", "active", "paused", "archived", "completed"] as const;
export const RENEWAL_INTENTS = ["strong", "positive", "neutral", "at_risk"] as const;
export const SUPPORT_CAPACITY_STATUSES = ["healthy", "watch", "overloaded"] as const;
export const BILLING_READINESS_SIGNALS = [
  "collect_evidence",
  "ready_for_billing_module",
  "defer"
] as const;

const TenantIdSchema = z.string().regex(/^TEN-\d{3}$/);
const ThemeIdSchema = z.string().regex(/^THEME-[A-Z0-9-]+$/);

export const CustomerScaleWaveSchema = z
  .object({
    wave_id: z.string().regex(/^WAVE-\d{3}$/),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    target_customer_count: z.number().int().min(1).max(15),
    tenant_ids: z.array(TenantIdSchema).min(1).max(15),
    admission_policy_id: z.string().regex(/^ADMISSION-\d{3}$/),
    owner_role: AdminUserRoleSchema,
    status: z.enum(SCALE_WAVE_STATUSES)
  })
  .strict();

export const CustomerAdmissionPolicySchema = z
  .object({
    policy_id: z.string().regex(/^ADMISSION-\d{3}$/),
    max_customer_count: z.number().int().min(10).max(15),
    required_reviews: z.array(AdminUserRoleSchema).min(1),
    allowed_service_tiers: z.array(z.enum(SERVICE_TIERS)).min(1),
    stop_conditions: z.array(z.string().min(1)).min(1),
    review_status: z.enum(SLA_REVIEW_STATUSES)
  })
  .strict();

export const CustomerOperationProfileSchema = z
  .object({
    tenant_id: TenantIdSchema,
    service_tier: z.enum(SERVICE_TIERS),
    support_owner: z.string().email(),
    privacy_owner: z.string().email(),
    contract_contact: z.string().email(),
    allowed_campaign_count: z.number().int().positive(),
    allowed_theme_ids: z.array(ThemeIdSchema).min(1),
    status: z.enum(ENTITLEMENT_STATUSES)
  })
  .strict();

export const CustomerRenewalSignalSchema = z
  .object({
    tenant_id: TenantIdSchema,
    review_period: z.string().min(1),
    renewal_intent: z.enum(RENEWAL_INTENTS),
    pricing_objection: z.boolean(),
    requested_features: z.array(z.string().min(1)),
    blocking_issues: z.array(z.string().min(1)),
    next_action: z.string().min(1)
  })
  .strict();

export const SupportCapacitySummarySchema = z
  .object({
    period: z.string().min(1),
    active_customer_count: z.number().int().nonnegative(),
    incident_count: z.number().int().nonnegative(),
    open_incident_count: z.number().int().nonnegative(),
    response_met_rate: z.number().min(0).max(1),
    review_completion_rate: z.number().min(0).max(1),
    capacity_status: z.enum(SUPPORT_CAPACITY_STATUSES)
  })
  .strict();

export const CustomerOpsReportPackageSchema = z
  .object({
    tenant_id: TenantIdSchema,
    report_id: z.string().regex(/^OPS-RPT-\d{3}$/),
    metrics_summary_id: z.string().regex(/^METRICS-\d{3}$/),
    privacy_scan_id: z.string().regex(/^PRIVACY-\d{3}$/),
    audit_summary_id: z.string().regex(/^AUDIT-SUMMARY-\d{3}$/),
    support_summary_id: z.string().regex(/^SUPPORT-SUMMARY-\d{3}$/),
    health_trend_id: z.string().regex(/^HEALTH-\d{3}$/),
    renewal_signal_id: z.string().regex(/^RENEWAL-\d{3}$/),
    generated_at: z.string().datetime()
  })
  .strict();

export const Phase14OpsReportSchema = z
  .object({
    customer_count: z.number().int().nonnegative(),
    active_customer_count: z.number().int().nonnegative(),
    wave_count: z.number().int().nonnegative(),
    admission_check_passed: z.boolean(),
    sla_check_passed: z.boolean(),
    tenant_isolation_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    support_capacity_passed: z.boolean(),
    billing_readiness_signal: z.enum(BILLING_READINESS_SIGNALS),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type ScaleWaveStatus = (typeof SCALE_WAVE_STATUSES)[number];
export type RenewalIntent = (typeof RENEWAL_INTENTS)[number];
export type SupportCapacityStatus = (typeof SUPPORT_CAPACITY_STATUSES)[number];
export type BillingReadinessSignal = (typeof BILLING_READINESS_SIGNALS)[number];
export type CustomerScaleWave = z.infer<typeof CustomerScaleWaveSchema>;
export type CustomerAdmissionPolicy = z.infer<typeof CustomerAdmissionPolicySchema>;
export type CustomerOperationProfile = z.infer<typeof CustomerOperationProfileSchema>;
export type CustomerRenewalSignal = z.infer<typeof CustomerRenewalSignalSchema>;
export type SupportCapacitySummary = z.infer<typeof SupportCapacitySummarySchema>;
export type CustomerOpsReportPackage = z.infer<typeof CustomerOpsReportPackageSchema>;
export type Phase14OpsReport = z.infer<typeof Phase14OpsReportSchema>;
