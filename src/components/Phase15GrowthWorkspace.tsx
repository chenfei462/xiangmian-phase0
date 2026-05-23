import {
  BadgeCheck,
  BriefcaseBusiness,
  FileText,
  Gauge,
  ShieldCheck,
  TrendingUp,
  Users
} from "lucide-react";
import type { JSX } from "react";

import type {
  CustomerPortfolioReport,
  Phase15ExpansionReport
} from "../lib/phase15-contracts";
import type { Phase15GrowthState } from "../lib/phase15-growth";
import type { PublishedConfigSnapshot } from "../lib/phase9-contracts";

type Phase15GrowthWorkspaceProps = {
  activeSnapshot: PublishedConfigSnapshot | null;
  activeTenantId: string;
  portfolioReport: CustomerPortfolioReport;
  postgresSchema: string;
  report: Phase15ExpansionReport;
  state: Phase15GrowthState;
};

export function Phase15GrowthWorkspace({
  activeSnapshot,
  activeTenantId,
  portfolioReport,
  postgresSchema,
  report,
  state
}: Phase15GrowthWorkspaceProps): JSX.Element {
  const activeLifecycle = state.lifecycle_states.find((lifecycle) => lifecycle.tenant_id === activeTenantId);
  const latestForecast = state.capacity_forecasts.at(-1);
  const retentionRiskCount = state.retention_signals.filter((signal) => signal.risk_level !== "low").length;
  const pricingObjectionCount = state.billing_evidence_backlog.filter(
    (evidence) => evidence.pricing_objection || evidence.contract_blockers.length > 0
  ).length;
  const activeLifecycleCount = state.lifecycle_states.filter(
    (lifecycle) =>
      lifecycle.tenant_id !== "TEN-001" &&
      (lifecycle.lifecycle_status === "stable" || lifecycle.lifecycle_status === "risk_watch")
  ).length;

  return (
    <section className="panel growth-workspace" aria-label="Phase 15 commercial expansion">
      <div className="panel-title">
        <BriefcaseBusiness size={18} aria-hidden="true" />
        Phase 15 Commercial Expansion v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <dl className="metric-grid">
        <div>
          <dt>Cohorts</dt>
          <dd>{portfolioReport.cohort_count}</dd>
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
          <dt>Growth</dt>
          <dd>{String(report.growth_check_passed)}</dd>
        </div>
        <div>
          <dt>Isolation</dt>
          <dd>{String(report.tenant_isolation_passed)}</dd>
        </div>
        <div>
          <dt>Capacity</dt>
          <dd>{String(report.support_capacity_passed)}</dd>
        </div>
        <div>
          <dt>Phase 16</dt>
          <dd>{report.phase16_recommendation}</dd>
        </div>
        <div>
          <dt>Go/No-Go</dt>
          <dd>{report.go_no_go_decision}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 15 growth guardrails">
        <span>
          <Users size={15} aria-hidden="true" /> 15-25 manual customers
        </span>
        <span>
          <Gauge size={15} aria-hidden="true" /> Capacity forecast
        </span>
        <span>
          <TrendingUp size={15} aria-hidden="true" /> Retention signals
        </span>
        <span>
          <FileText size={15} aria-hidden="true" /> Billing evidence only
        </span>
      </div>

      {activeSnapshot ? (
        <dl className="metric-grid growth-metrics">
          <div>
            <dt>H5 snapshot</dt>
            <dd>{activeSnapshot.snapshot_id}</dd>
          </div>
          <div>
            <dt>Snapshot tenant</dt>
            <dd>{activeSnapshot.tenant_id}</dd>
          </div>
          <div>
            <dt>Lifecycle</dt>
            <dd>{activeLifecycle?.lifecycle_status ?? "missing"}</dd>
          </div>
          <div>
            <dt>Privacy</dt>
            <dd>{String(report.privacy_check_passed)}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">
          H5 is blocked because this tenant does not have a stable commercial-approved published snapshot.
        </p>
      )}

      <dl className="metric-grid growth-metrics">
        <div>
          <dt>Onboarding</dt>
          <dd>{Math.round(portfolioReport.onboarding_completion_rate * 100)}%</dd>
        </div>
        <div>
          <dt>Retention risk</dt>
          <dd>{retentionRiskCount}</dd>
        </div>
        <div>
          <dt>Billing evidence</dt>
          <dd>{String(report.billing_evidence_ready)}</dd>
        </div>
        <div>
          <dt>Pricing blockers</dt>
          <dd>{pricingObjectionCount}</dd>
        </div>
        <div>
          <dt>Forecast load</dt>
          <dd>{latestForecast ? `${Math.round(latestForecast.projected_load * 100)}%` : "pending"}</dd>
        </div>
        <div>
          <dt>Open incidents</dt>
          <dd>{latestForecast?.open_incident_count ?? 0}</dd>
        </div>
        <div>
          <dt>Response met</dt>
          <dd>{latestForecast ? `${Math.round(latestForecast.response_met_rate * 100)}%` : "pending"}</dd>
        </div>
        <div>
          <dt>Capacity status</dt>
          <dd>{latestForecast?.capacity_status ?? "pending"}</dd>
        </div>
      </dl>

      <dl className="metric-grid growth-metrics">
        <div>
          <dt>Lifecycle active</dt>
          <dd>{activeLifecycleCount}</dd>
        </div>
        <div>
          <dt>Retention rows</dt>
          <dd>{state.retention_signals.length}</dd>
        </div>
        <div>
          <dt>Evidence rows</dt>
          <dd>{state.billing_evidence_backlog.length}</dd>
        </div>
        <div>
          <dt>DDL tables</dt>
          <dd>{postgresSchema.split("\n").length}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 15 constraints">
        <span>
          <BadgeCheck size={15} aria-hidden="true" /> Manual admission only
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Snapshot gated
        </span>
        <span>No public signup</span>
        <span>No online payment</span>
        <span>No hardware SDK</span>
      </div>
    </section>
  );
}
