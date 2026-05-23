import {
  ClipboardCheck,
  FileBarChart,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Siren
} from "lucide-react";
import type { JSX } from "react";

import type {
  CommercialCustomerReport,
  Phase12ExpansionReport
} from "../lib/phase12-contracts";
import type { Phase12ExpansionState } from "../lib/phase12-expansion";
import type { PublishedConfigSnapshot } from "../lib/phase9-contracts";

type Phase12ExpansionWorkspaceProps = {
  activeSnapshot: PublishedConfigSnapshot | null;
  activeTenantId: string;
  customerReport: CommercialCustomerReport;
  postgresSchema: string;
  report: Phase12ExpansionReport;
  state: Phase12ExpansionState;
};

export function Phase12ExpansionWorkspace({
  activeSnapshot,
  activeTenantId,
  customerReport,
  postgresSchema,
  report,
  state
}: Phase12ExpansionWorkspaceProps): JSX.Element {
  const activeBatch = state.expansion_batches[0];
  const activeEntitlement = state.tenant_entitlements.find(
    (entitlement) => entitlement.tenant_id === activeTenantId
  );
  const reportEntitlement = state.tenant_entitlements.find(
    (entitlement) => entitlement.tenant_id === customerReport.tenant_id
  );
  const reportHealth = state.customer_health_scores.find(
    (health) => health.tenant_id === customerReport.tenant_id
  );

  return (
    <section className="panel expansion-workspace" aria-label="Phase 12 customer expansion run">
      <div className="panel-title">
        <ClipboardCheck size={18} aria-hidden="true" />
        Phase 12 Customer Expansion v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <dl className="metric-grid">
        <div>
          <dt>Batch</dt>
          <dd>{activeBatch.batch_id}</dd>
        </div>
        <div>
          <dt>Batch status</dt>
          <dd>{activeBatch.status}</dd>
        </div>
        <div>
          <dt>Target customers</dt>
          <dd>{activeBatch.target_customer_count}</dd>
        </div>
        <div>
          <dt>Active customers</dt>
          <dd>{report.active_customer_count}</dd>
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
          <dt>Privacy</dt>
          <dd>{String(report.privacy_check_passed)}</dd>
        </div>
        <div>
          <dt>Go/No-Go</dt>
          <dd>{report.go_no_go_decision}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 12 expansion guardrails">
        <span>
          <LockKeyhole size={15} aria-hidden="true" /> Tenant isolation
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Privacy scan
        </span>
        <span>
          <Siren size={15} aria-hidden="true" /> SLA runbook
        </span>
        <span>
          <FileBarChart size={15} aria-hidden="true" /> Customer report
        </span>
      </div>

      {activeSnapshot ? (
        <dl className="metric-grid expansion-metrics">
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
          当前 H5 没有 active tenant 的 commercial-approved published snapshot；draft、review、paused、suspended、archived、rolled_back 均不可被消费。
        </p>
      )}

      <dl className="metric-grid expansion-metrics">
        <div>
          <dt>Report tenant</dt>
          <dd>{customerReport.tenant_id}</dd>
        </div>
        <div>
          <dt>Tier</dt>
          <dd>{reportEntitlement?.service_tier ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Campaigns</dt>
          <dd>{customerReport.campaign_count}</dd>
        </div>
        <div>
          <dt>Snapshots</dt>
          <dd>{customerReport.published_snapshot_count}</dd>
        </div>
        <div>
          <dt>Completion</dt>
          <dd>{Math.round(customerReport.completion_rate * 100)}%</dd>
        </div>
        <div>
          <dt>Manual mode</dt>
          <dd>{Math.round(customerReport.manual_completion_rate * 100)}%</dd>
        </div>
        <div>
          <dt>Health</dt>
          <dd>{reportHealth ? `${reportHealth.score}/${reportHealth.status}` : "pending"}</dd>
        </div>
        <div>
          <dt>Negative feedback</dt>
          <dd>{customerReport.negative_feedback_count}</dd>
        </div>
      </dl>

      <dl className="metric-grid expansion-metrics">
        <div>
          <dt>Runbooks</dt>
          <dd>{state.support_runbooks.length}</dd>
        </div>
        <div>
          <dt>Success reviews</dt>
          <dd>{state.success_reviews.length}</dd>
        </div>
        <div>
          <dt>DDL tables</dt>
          <dd>{postgresSchema.split("\n").length}</dd>
        </div>
        <div>
          <dt>Privacy scans</dt>
          <dd>{state.privacy_scans.filter((scan) => scan.passed).length}/{state.privacy_scans.length}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 12 constraints">
        <span>
          <HeartPulse size={15} aria-hidden="true" /> Customer health score
        </span>
        <span>No public signup</span>
        <span>No billing</span>
        <span>No hardware SDK</span>
      </div>
    </section>
  );
}
