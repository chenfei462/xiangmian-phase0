import { z } from "zod";

import { PHASE5_DECISIONS } from "./phase5-contracts";
import { AdminUserRoleSchema } from "./phase8-contracts";
import { SAAS_ADMIN_ACTIONS } from "./phase9-contracts";
import { PHASE10_TARGET_TYPES } from "./phase10-contracts";

export const COMMERCIAL_STATUSES = [
  "onboarding",
  "active",
  "paused",
  "suspended",
  "archived"
] as const;
export const SERVICE_TIERS = ["starter", "professional", "enterprise_trial"] as const;
export const DATA_REGIONS = ["cn", "apac", "sandbox"] as const;
export const AUTH_SESSION_STATUSES = ["active", "expired", "revoked"] as const;
export const DATABASE_ENVIRONMENTS = ["staging", "commercial", "restore_drill"] as const;
export const BACKUP_STATUSES = ["scheduled", "completed", "failed"] as const;
export const CHECKLIST_ITEM_STATUSES = ["pending", "complete", "blocked"] as const;
export const SUPPORT_SEVERITIES = ["sev1", "sev2", "sev3"] as const;
export const SUPPORT_CATEGORIES = [
  "privacy",
  "permission",
  "content",
  "availability",
  "customer_ops"
] as const;
export const INCIDENT_STATUSES = ["open", "investigating", "resolved", "closed"] as const;

export const CommercialTenantSchema = z
  .object({
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    client_name: z.string().min(1),
    commercial_status: z.enum(COMMERCIAL_STATUSES),
    service_tier: z.enum(SERVICE_TIERS),
    enabled_campaign_ids: z.array(z.string().regex(/^CMP-\d{3}$/)).min(1),
    allowed_campaign_count: z.number().int().positive(),
    support_owner: z.string().email(),
    privacy_owner: z.string().email(),
    data_region: z.enum(DATA_REGIONS),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable()
  })
  .strict();

export const AdminAuthSessionSchema = z
  .object({
    session_id: z.string().regex(/^SESS-\d{3}$/),
    admin_id: z.string().regex(/^ADM-\d{3}$/),
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    role: AdminUserRoleSchema,
    issued_at: z.string().datetime(),
    expires_at: z.string().datetime(),
    mfa_required: z.boolean(),
    status: z.enum(AUTH_SESSION_STATUSES)
  })
  .strict();

export const TenantPermissionCheckSchema = z
  .object({
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    admin_id: z.string().regex(/^ADM-\d{3}$/),
    action: z.enum(SAAS_ADMIN_ACTIONS),
    target_type: z.enum(PHASE10_TARGET_TYPES),
    target_id: z.string().min(1),
    allowed: z.boolean(),
    reason: z.string().min(1)
  })
  .strict();

export const ManagedDatabaseStatusSchema = z
  .object({
    database_id: z.string().regex(/^DB-\d{3}$/),
    environment: z.enum(DATABASE_ENVIRONMENTS),
    migration_version: z.string().min(1),
    backup_status: z.enum(BACKUP_STATUSES),
    last_backup_at: z.string().datetime(),
    last_restore_drill_at: z.string().datetime(),
    restore_drill_passed: z.boolean()
  })
  .strict();

export const ChecklistItemSchema = z
  .object({
    item_id: z.string().regex(/^ONB-ITEM-\d{3}$/),
    label: z.string().min(1),
    status: z.enum(CHECKLIST_ITEM_STATUSES),
    evidence: z.string().min(1)
  })
  .strict();

export const CustomerOnboardingChecklistSchema = z
  .object({
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    items: z.array(ChecklistItemSchema).min(1),
    owner_role: AdminUserRoleSchema,
    status: z.enum(CHECKLIST_ITEM_STATUSES),
    evidence: z.string().min(1),
    completed_at: z.string().datetime().nullable()
  })
  .strict();

export const CommercialExportPackageSchema = z
  .object({
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    snapshot_id: z.string().regex(/^SNP-\d{3}$/),
    metrics_summary_id: z.string().regex(/^METRICS-\d{3}$/),
    audit_export_id: z.string().regex(/^AUDIT-EXPORT-\d{3}$/),
    privacy_scan_id: z.string().regex(/^PRIVACY-\d{3}$/),
    generated_at: z.string().datetime()
  })
  .strict();

export const SupportIncidentSchema = z
  .object({
    incident_id: z.string().regex(/^INC-\d{3}$/),
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    severity: z.enum(SUPPORT_SEVERITIES),
    category: z.enum(SUPPORT_CATEGORIES),
    status: z.enum(INCIDENT_STATUSES),
    reported_at: z.string().datetime(),
    resolved_at: z.string().datetime().nullable(),
    root_cause: z.string().min(1),
    follow_up_actions: z.array(z.string().min(1))
  })
  .strict();

export const Phase11CommercialReportSchema = z
  .object({
    tenant_count: z.number().int().nonnegative(),
    active_customer_count: z.number().int().nonnegative(),
    migration_check_passed: z.boolean(),
    rbac_check_passed: z.boolean(),
    backup_restore_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    customer_readiness_summary: z.string().min(1),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number];
export type ServiceTier = (typeof SERVICE_TIERS)[number];
export type DataRegion = (typeof DATA_REGIONS)[number];
export type AuthSessionStatus = (typeof AUTH_SESSION_STATUSES)[number];
export type DatabaseEnvironment = (typeof DATABASE_ENVIRONMENTS)[number];
export type BackupStatus = (typeof BACKUP_STATUSES)[number];
export type ChecklistItemStatus = (typeof CHECKLIST_ITEM_STATUSES)[number];
export type SupportSeverity = (typeof SUPPORT_SEVERITIES)[number];
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export type CommercialTenant = z.infer<typeof CommercialTenantSchema>;
export type AdminAuthSession = z.infer<typeof AdminAuthSessionSchema>;
export type TenantPermissionCheck = z.infer<typeof TenantPermissionCheckSchema>;
export type ManagedDatabaseStatus = z.infer<typeof ManagedDatabaseStatusSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type CustomerOnboardingChecklist = z.infer<typeof CustomerOnboardingChecklistSchema>;
export type CommercialExportPackage = z.infer<typeof CommercialExportPackageSchema>;
export type SupportIncident = z.infer<typeof SupportIncidentSchema>;
export type Phase11CommercialReport = z.infer<typeof Phase11CommercialReportSchema>;
