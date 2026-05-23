import { z } from "zod";

import { PHASE5_DECISIONS } from "./phase5-contracts";
import { SAAS_ADMIN_ACTIONS, SAAS_TARGET_TYPES } from "./phase9-contracts";

export const PILOT_STATUSES = [
  "planned",
  "staging",
  "pilot",
  "paused",
  "completed",
  "rolled_back"
] as const;
export const SAAS_RELEASE_CHANNELS = ["staging", "pilot", "production_shadow"] as const;
export const SAAS_DATABASE_MODES = [
  "local_adapter",
  "postgres_compatible",
  "managed_postgres"
] as const;
export const SAAS_SNAPSHOT_SOURCES = [
  "published_snapshot",
  "rollback_snapshot",
  "local_fallback"
] as const;
export const SAAS_METRICS_MODES = ["fixture", "anonymous_ingestion", "aggregated"] as const;
export const PILOT_RELEASE_STATUSES = ["staging", "pilot", "paused", "rolled_back"] as const;
export const PHASE10_TARGET_TYPES = [
  ...SAAS_TARGET_TYPES,
  "pilot_release",
  "privacy_scan",
  "pilot_report",
  "saas_environment"
] as const;

export const PilotTenantSchema = z
  .object({
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    client_name: z.string().min(1),
    pilot_status: z.enum(PILOT_STATUSES),
    started_at: z.string().datetime(),
    ended_at: z.string().datetime().nullable(),
    enabled_campaign_ids: z.array(z.string().regex(/^CMP-\d{3}$/)).min(1),
    operator_contact: z.string().min(1),
    privacy_owner: z.string().min(1)
  })
  .strict();

export const SaasEnvironmentSchema = z
  .object({
    environment_id: z.string().regex(/^ENV-\d{3}$/),
    name: z.string().min(1),
    release_channel: z.enum(SAAS_RELEASE_CHANNELS),
    database_mode: z.enum(SAAS_DATABASE_MODES),
    snapshot_source: z.enum(SAAS_SNAPSHOT_SOURCES),
    metrics_mode: z.enum(SAAS_METRICS_MODES)
  })
  .strict();

export const PilotReleaseSchema = z
  .object({
    release_id: z.string().regex(/^REL-\d{3}$/),
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    snapshot_id: z.string().regex(/^SNP-\d{3}$/),
    status: z.enum(PILOT_RELEASE_STATUSES),
    released_by: z.string().regex(/^ADM-\d{3}$/),
    released_at: z.string().datetime(),
    rollback_snapshot_id: z.string().regex(/^SNP-\d{3}$/).nullable()
  })
  .strict();

export const ProductionAuditPolicySchema = z
  .object({
    target_type: z.enum(PHASE10_TARGET_TYPES),
    required_actions: z.array(z.enum(SAAS_ADMIN_ACTIONS)).min(1),
    retention_days: z.number().int().min(30),
    hash_only_fields: z.array(z.string().min(1)),
    export_allowed: z.boolean()
  })
  .strict();

export const PrivacyScanResultSchema = z
  .object({
    target_id: z.string().min(1),
    target_type: z.enum(PHASE10_TARGET_TYPES),
    forbidden_fields: z.array(z.string().min(1)),
    passed: z.boolean(),
    scanned_at: z.string().datetime()
  })
  .strict();

export const PilotMetricsSummarySchema = z
  .object({
    tenant_id: z.string().regex(/^TEN-\d{3}$/),
    campaign_id: z.string().regex(/^CMP-\d{3}$/),
    sample_size: z.number().int().nonnegative(),
    completion_rate: z.number().min(0).max(1),
    manual_completion_rate: z.number().min(0).max(1),
    action_success_rate: z.number().min(0).max(1),
    poster_generation_rate: z.number().min(0).max(1),
    negative_feedback_count: z.number().int().nonnegative()
  })
  .strict();

export const Phase10PilotReportSchema = z
  .object({
    tenant_count: z.number().int().nonnegative(),
    pilot_release_count: z.number().int().nonnegative(),
    rollback_drill_passed: z.boolean(),
    privacy_check_passed: z.boolean(),
    audit_check_passed: z.boolean(),
    customer_feedback_summary: z.string().min(1),
    go_no_go_decision: z.enum(PHASE5_DECISIONS)
  })
  .strict();

export type PilotStatus = (typeof PILOT_STATUSES)[number];
export type SaasReleaseChannel = (typeof SAAS_RELEASE_CHANNELS)[number];
export type SaasDatabaseMode = (typeof SAAS_DATABASE_MODES)[number];
export type SaasSnapshotSource = (typeof SAAS_SNAPSHOT_SOURCES)[number];
export type SaasMetricsMode = (typeof SAAS_METRICS_MODES)[number];
export type PilotReleaseStatus = (typeof PILOT_RELEASE_STATUSES)[number];
export type Phase10TargetType = (typeof PHASE10_TARGET_TYPES)[number];
export type PilotTenant = z.infer<typeof PilotTenantSchema>;
export type SaasEnvironment = z.infer<typeof SaasEnvironmentSchema>;
export type PilotRelease = z.infer<typeof PilotReleaseSchema>;
export type ProductionAuditPolicy = z.infer<typeof ProductionAuditPolicySchema>;
export type PrivacyScanResult = z.infer<typeof PrivacyScanResultSchema>;
export type PilotMetricsSummary = z.infer<typeof PilotMetricsSummarySchema>;
export type Phase10PilotReport = z.infer<typeof Phase10PilotReportSchema>;
