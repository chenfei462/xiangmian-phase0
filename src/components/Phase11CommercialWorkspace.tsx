import {
  Archive,
  BadgeCheck,
  DatabaseBackup,
  Headset,
  KeyRound,
  ShieldCheck
} from "lucide-react";
import type { JSX } from "react";

import type {
  CommercialExportPackage,
  Phase11CommercialReport
} from "../lib/phase11-contracts";
import type { Phase11CommercialState } from "../lib/phase11-commercial";
import type { PublishedConfigSnapshot } from "../lib/phase9-contracts";

type Phase11CommercialWorkspaceProps = {
  activeSnapshot: PublishedConfigSnapshot | null;
  activeTenantId: string;
  exportPackage: CommercialExportPackage | null;
  postgresSchema: string;
  report: Phase11CommercialReport;
  state: Phase11CommercialState;
};

export function Phase11CommercialWorkspace({
  activeSnapshot,
  activeTenantId,
  exportPackage,
  postgresSchema,
  report,
  state
}: Phase11CommercialWorkspaceProps): JSX.Element {
  const activeTenant = state.commercial_tenants.find((tenant) => tenant.tenant_id === activeTenantId);
  const activeSessions = state.auth_sessions.filter(
    (session) => session.tenant_id === activeTenantId && session.status === "active"
  );
  const activeChecklist = state.onboarding_checklists.find(
    (checklist) => checklist.tenant_id === activeTenantId
  );

  return (
    <section className="panel commercial-workspace" aria-label="Phase 11 commercial SaaS hardening">
      <div className="panel-title">
        <BadgeCheck size={18} aria-hidden="true" />
        Phase 11 Commercial SaaS v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <dl className="metric-grid">
        <div>
          <dt>Customer</dt>
          <dd>{activeTenant?.client_name ?? activeTenantId}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{activeTenant?.commercial_status ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Tier</dt>
          <dd>{activeTenant?.service_tier ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Active customers</dt>
          <dd>{report.active_customer_count}</dd>
        </div>
        <div>
          <dt>RBAC</dt>
          <dd>{String(report.rbac_check_passed)}</dd>
        </div>
        <div>
          <dt>Backup restore</dt>
          <dd>{String(report.backup_restore_passed)}</dd>
        </div>
        <div>
          <dt>Privacy</dt>
          <dd>{String(report.privacy_check_passed)}</dd>
        </div>
        <div>
          <dt>Go/No-Go</dt>
          <dd>{report.go_no_go_decision}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 11 guardrails">
        <span>
          <KeyRound size={15} aria-hidden="true" /> Manual account opening
        </span>
        <span>
          <DatabaseBackup size={15} aria-hidden="true" /> Managed PostgreSQL
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Tenant-scoped RBAC
        </span>
        <span>
          <Archive size={15} aria-hidden="true" /> Audit export package
        </span>
      </div>

      {activeSnapshot ? (
        <dl className="metric-grid commercial-metrics">
          <div>
            <dt>Commercial snapshot</dt>
            <dd>{activeSnapshot.snapshot_id}</dd>
          </div>
          <div>
            <dt>Campaign</dt>
            <dd>{activeSnapshot.campaign_id}</dd>
          </div>
          <div>
            <dt>Sessions</dt>
            <dd>{activeSessions.length}</dd>
          </div>
          <div>
            <dt>Onboarding</dt>
            <dd>{activeChecklist?.status ?? "missing"}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">当前活动没有 commercial-approved published snapshot，H5 不会读取草稿、review、paused 或 rolled_back 配置。</p>
      )}

      {exportPackage ? (
        <dl className="metric-grid commercial-metrics">
          <div>
            <dt>Export snapshot</dt>
            <dd>{exportPackage.snapshot_id}</dd>
          </div>
          <div>
            <dt>Metrics</dt>
            <dd>{exportPackage.metrics_summary_id}</dd>
          </div>
          <div>
            <dt>Audit</dt>
            <dd>{exportPackage.audit_export_id}</dd>
          </div>
          <div>
            <dt>Privacy scan</dt>
            <dd>{exportPackage.privacy_scan_id}</dd>
          </div>
        </dl>
      ) : null}

      <dl className="metric-grid commercial-metrics">
        <div>
          <dt>DDL tables</dt>
          <dd>{postgresSchema.split("\n").length}</dd>
        </div>
        <div>
          <dt>Incidents</dt>
          <dd>{state.support_incidents.length}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 11 commercial constraints">
        <span>
          <Headset size={15} aria-hidden="true" /> Customer SOP ready
        </span>
        <span>No public signup</span>
        <span>No billing</span>
        <span>No hardware SDK</span>
      </div>

      <p className="muted">{report.customer_readiness_summary}</p>
    </section>
  );
}
