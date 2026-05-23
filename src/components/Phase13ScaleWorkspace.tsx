import {
  Activity,
  BadgeCheck,
  FileText,
  Layers,
  ShieldCheck,
  Users
} from "lucide-react";
import type { JSX } from "react";

import type {
  CustomerReportPackage,
  Phase13ScaleReport
} from "../lib/phase13-contracts";
import type { Phase13ScaleState } from "../lib/phase13-scale";
import type { PublishedConfigSnapshot } from "../lib/phase9-contracts";

type Phase13ScaleWorkspaceProps = {
  activeSnapshot: PublishedConfigSnapshot | null;
  activeTenantId: string;
  postgresSchema: string;
  report: Phase13ScaleReport;
  reportPackage: CustomerReportPackage;
  state: Phase13ScaleState;
};

export function Phase13ScaleWorkspace({
  activeSnapshot,
  activeTenantId,
  postgresSchema,
  report,
  reportPackage,
  state
}: Phase13ScaleWorkspaceProps): JSX.Element {
  const activeEntitlement = state.tenant_entitlements.find(
    (entitlement) => entitlement.tenant_id === activeTenantId
  );
  const packageEntitlement = state.tenant_entitlements.find(
    (entitlement) => entitlement.tenant_id === reportPackage.tenant_id
  );
  const latestHealth = state.health_trends.find((trend) => trend.tenant_id === reportPackage.tenant_id);
  const slaSummary = state.sla_performance_summaries.find(
    (summary) => summary.tenant_id === reportPackage.tenant_id
  );

  return (
    <section className="panel scale-workspace" aria-label="Phase 13 commercial scale run">
      <div className="panel-title">
        <Users size={18} aria-hidden="true" />
        Phase 13 Commercial Scale v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <dl className="metric-grid">
        <div>
          <dt>Batches</dt>
          <dd>{report.batch_count}</dd>
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
          <dt>Onboarding</dt>
          <dd>{String(report.onboarding_check_passed)}</dd>
        </div>
        <div>
          <dt>SLA</dt>
          <dd>{String(report.sla_check_passed)}</dd>
        </div>
        <div>
          <dt>Isolation</dt>
          <dd>{String(report.tenant_isolation_passed)}</dd>
        </div>
        <div>
          <dt>Support load</dt>
          <dd>{String(report.support_load_acceptable)}</dd>
        </div>
        <div>
          <dt>Go/No-Go</dt>
          <dd>{report.go_no_go_decision}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 13 scale guardrails">
        <span>
          <Layers size={15} aria-hidden="true" /> Multi-batch delivery
        </span>
        <span>
          <Activity size={15} aria-hidden="true" /> SLA performance
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Privacy scan
        </span>
        <span>
          <FileText size={15} aria-hidden="true" /> Report package
        </span>
      </div>

      {activeSnapshot ? (
        <dl className="metric-grid scale-metrics">
          <div>
            <dt>H5 snapshot</dt>
            <dd>{activeSnapshot.snapshot_id}</dd>
          </div>
          <div>
            <dt>Snapshot tenant</dt>
            <dd>{activeSnapshot.tenant_id}</dd>
          </div>
          <div>
            <dt>Entitlement</dt>
            <dd>{activeEntitlement?.status ?? "missing"}</dd>
          </div>
          <div>
            <dt>Allowed themes</dt>
            <dd>{activeEntitlement?.allowed_theme_ids.length ?? 0}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">
          H5 is blocked because this tenant does not have an active commercial-approved published snapshot.
        </p>
      )}

      <dl className="metric-grid scale-metrics">
        <div>
          <dt>Report package</dt>
          <dd>{reportPackage.report_id}</dd>
        </div>
        <div>
          <dt>Tenant</dt>
          <dd>{reportPackage.tenant_id}</dd>
        </div>
        <div>
          <dt>Tier</dt>
          <dd>{packageEntitlement?.service_tier ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd>{latestHealth ? `${latestHealth.score}/${latestHealth.status}` : "pending"}</dd>
        </div>
        <div>
          <dt>SLA met</dt>
          <dd>{slaSummary ? `${Math.round(slaSummary.response_met_rate * 100)}%` : "pending"}</dd>
        </div>
        <div>
          <dt>Open incidents</dt>
          <dd>{slaSummary?.open_incident_count ?? 0}</dd>
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

      <dl className="metric-grid scale-metrics">
        <div>
          <dt>Onboarding runs</dt>
          <dd>{state.onboarding_runs.length}</dd>
        </div>
        <div>
          <dt>Health trends</dt>
          <dd>{state.health_trends.length}</dd>
        </div>
        <div>
          <dt>Readiness gates</dt>
          <dd>{state.readiness_gates.filter((gate) => gate.status === "pass").length}/{state.readiness_gates.length}</dd>
        </div>
        <div>
          <dt>DDL tables</dt>
          <dd>{postgresSchema.split("\n").length}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 13 constraints">
        <span>
          <BadgeCheck size={15} aria-hidden="true" /> Manual admission only
        </span>
        <span>No public signup</span>
        <span>No billing</span>
        <span>No hardware SDK</span>
      </div>
    </section>
  );
}
