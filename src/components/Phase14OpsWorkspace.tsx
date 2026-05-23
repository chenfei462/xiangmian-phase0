import {
  BadgeCheck,
  BriefcaseBusiness,
  FileCheck2,
  FileText,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";
import type { JSX } from "react";

import type {
  CustomerOpsReportPackage,
  Phase14OpsReport
} from "../lib/phase14-contracts";
import type { Phase14OpsState } from "../lib/phase14-ops";
import type { PublishedConfigSnapshot } from "../lib/phase9-contracts";

type Phase14OpsWorkspaceProps = {
  activeSnapshot: PublishedConfigSnapshot | null;
  activeTenantId: string;
  postgresSchema: string;
  report: Phase14OpsReport;
  reportPackage: CustomerOpsReportPackage;
  state: Phase14OpsState;
};

export function Phase14OpsWorkspace({
  activeSnapshot,
  activeTenantId,
  postgresSchema,
  report,
  reportPackage,
  state
}: Phase14OpsWorkspaceProps): JSX.Element {
  const activeProfile = state.operation_profiles.find((profile) => profile.tenant_id === activeTenantId);
  const packageProfile = state.operation_profiles.find(
    (profile) => profile.tenant_id === reportPackage.tenant_id
  );
  const renewalSignal = state.renewal_signals.find(
    (signal) => signal.tenant_id === reportPackage.tenant_id
  );
  const supportCapacity = state.support_capacity_summaries.at(-1);
  const activeProfiles = state.operation_profiles.filter(
    (profile) => profile.status === "active" && profile.tenant_id !== "TEN-001"
  );

  return (
    <section className="panel ops-workspace" aria-label="Phase 14 stable commercial operations">
      <div className="panel-title">
        <BriefcaseBusiness size={18} aria-hidden="true" />
        Phase 14 Stable Operations v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <dl className="metric-grid">
        <div>
          <dt>Waves</dt>
          <dd>{report.wave_count}</dd>
        </div>
        <div>
          <dt>Customers</dt>
          <dd>{report.customer_count}</dd>
        </div>
        <div>
          <dt>Active</dt>
          <dd>{report.active_customer_count}</dd>
        </div>
        <div>
          <dt>Admission</dt>
          <dd>{String(report.admission_check_passed)}</dd>
        </div>
        <div>
          <dt>SLA</dt>
          <dd>{String(report.sla_check_passed)}</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{String(report.support_capacity_passed)}</dd>
        </div>
        <div>
          <dt>Billing signal</dt>
          <dd>{report.billing_readiness_signal}</dd>
        </div>
        <div>
          <dt>Go/No-Go</dt>
          <dd>{report.go_no_go_decision}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 14 operations guardrails">
        <span>
          <Users size={15} aria-hidden="true" /> 10-15 manual customers
        </span>
        <span>
          <TrendingUp size={15} aria-hidden="true" /> Renewal evidence
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Support capacity
        </span>
        <span>
          <FileCheck2 size={15} aria-hidden="true" /> Ops report package
        </span>
      </div>

      {activeSnapshot ? (
        <dl className="metric-grid ops-metrics">
          <div>
            <dt>H5 snapshot</dt>
            <dd>{activeSnapshot.snapshot_id}</dd>
          </div>
          <div>
            <dt>Snapshot tenant</dt>
            <dd>{activeSnapshot.tenant_id}</dd>
          </div>
          <div>
            <dt>Ops profile</dt>
            <dd>{activeProfile?.status ?? "missing"}</dd>
          </div>
          <div>
            <dt>Theme auth</dt>
            <dd>{activeProfile?.allowed_theme_ids.length ?? 0}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">
          H5 is blocked because this tenant does not have an active commercial-approved published snapshot.
        </p>
      )}

      <dl className="metric-grid ops-metrics">
        <div>
          <dt>Ops package</dt>
          <dd>{reportPackage.report_id}</dd>
        </div>
        <div>
          <dt>Tenant</dt>
          <dd>{reportPackage.tenant_id}</dd>
        </div>
        <div>
          <dt>Tier</dt>
          <dd>{packageProfile?.service_tier ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Renewal</dt>
          <dd>{renewalSignal?.renewal_intent ?? "pending"}</dd>
        </div>
        <div>
          <dt>Pricing objection</dt>
          <dd>{String(renewalSignal?.pricing_objection ?? false)}</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{supportCapacity?.capacity_status ?? "pending"}</dd>
        </div>
        <div>
          <dt>Privacy scan</dt>
          <dd>{reportPackage.privacy_scan_id}</dd>
        </div>
        <div>
          <dt>Audit summary</dt>
          <dd>{reportPackage.audit_summary_id}</dd>
        </div>
      </dl>

      <dl className="metric-grid ops-metrics">
        <div>
          <dt>Active profiles</dt>
          <dd>{activeProfiles.length}</dd>
        </div>
        <div>
          <dt>Renewal signals</dt>
          <dd>{state.renewal_signals.length}</dd>
        </div>
        <div>
          <dt>Support summaries</dt>
          <dd>{state.support_capacity_summaries.length}</dd>
        </div>
        <div>
          <dt>DDL tables</dt>
          <dd>{postgresSchema.split("\n").length}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 14 constraints">
        <span>
          <BadgeCheck size={15} aria-hidden="true" /> Manual admission only
        </span>
        <span>
          <FileText size={15} aria-hidden="true" /> Contract evidence only
        </span>
        <span>No public signup</span>
        <span>No online payment</span>
        <span>No hardware SDK</span>
      </div>
    </section>
  );
}
