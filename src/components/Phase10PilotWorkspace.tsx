import {
  BarChart3,
  ClipboardCheck,
  Database,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import type { JSX } from "react";

import type { Phase10PilotReport, PilotMetricsSummary } from "../lib/phase10-contracts";
import type { Phase10PilotState } from "../lib/phase10-pilot";
import type { PublishedConfigSnapshot } from "../lib/phase9-contracts";

type Phase10PilotWorkspaceProps = {
  activeSnapshot: PublishedConfigSnapshot | null;
  activeTenantId: string;
  metricsSummary: PilotMetricsSummary | null;
  postgresSchema: string;
  report: Phase10PilotReport;
  state: Phase10PilotState;
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function Phase10PilotWorkspace({
  activeSnapshot,
  activeTenantId,
  metricsSummary,
  postgresSchema,
  report,
  state
}: Phase10PilotWorkspaceProps): JSX.Element {
  const activeTenant = state.pilot_tenants.find((tenant) => tenant.tenant_id === activeTenantId);
  const activeRelease = activeSnapshot
    ? state.pilot_releases.find(
        (release) =>
          release.tenant_id === activeTenantId &&
          release.campaign_id === activeSnapshot.campaign_id &&
          release.snapshot_id === activeSnapshot.snapshot_id &&
          release.status === "pilot"
      )
    : null;
  const pilotEnvironment = state.environments.find((environment) => environment.release_channel === "pilot");

  return (
    <section className="panel pilot-workspace" aria-label="Phase 10 controlled SaaS pilot">
      <div className="panel-title">
        <SlidersHorizontal size={18} aria-hidden="true" />
        Phase 10 Pilot SaaS v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <dl className="metric-grid">
        <div>
          <dt>Pilot tenant</dt>
          <dd>{activeTenant?.client_name ?? activeTenantId}</dd>
        </div>
        <div>
          <dt>Pilot status</dt>
          <dd>{activeTenant?.pilot_status ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Tenants</dt>
          <dd>{report.tenant_count}</dd>
        </div>
        <div>
          <dt>Releases</dt>
          <dd>{report.pilot_release_count}</dd>
        </div>
        <div>
          <dt>Database</dt>
          <dd>{pilotEnvironment?.database_mode ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Metrics</dt>
          <dd>{pilotEnvironment?.metrics_mode ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Rollback</dt>
          <dd>{String(report.rollback_drill_passed)}</dd>
        </div>
        <div>
          <dt>Go/No-Go</dt>
          <dd>{report.go_no_go_decision}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 10 guardrails">
        <span>
          <Database size={15} aria-hidden="true" /> PostgreSQL-compatible
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Privacy:{" "}
          {String(report.privacy_check_passed)}
        </span>
        <span>
          <RotateCcw size={15} aria-hidden="true" /> Stop and rollback ready
        </span>
        <span>
          <ClipboardCheck size={15} aria-hidden="true" /> Audit:{" "}
          {String(report.audit_check_passed)}
        </span>
      </div>

      {activeSnapshot && activeRelease ? (
        <dl className="metric-grid pilot-metrics">
          <div>
            <dt>Active release</dt>
            <dd>{activeRelease.release_id}</dd>
          </div>
          <div>
            <dt>Snapshot</dt>
            <dd>{activeSnapshot.snapshot_id}</dd>
          </div>
          <div>
            <dt>Campaign</dt>
            <dd>{activeSnapshot.campaign_id}</dd>
          </div>
          <div>
            <dt>Channel</dt>
            <dd>{activeRelease.status}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">当前活动未进入 pilot release，H5 会进入安全兜底或读取本地稳定快照。</p>
      )}

      {metricsSummary ? (
        <dl className="metric-grid pilot-metrics">
          <div>
            <dt>Sample</dt>
            <dd>{metricsSummary.sample_size}</dd>
          </div>
          <div>
            <dt>Completion</dt>
            <dd>{percent(metricsSummary.completion_rate)}</dd>
          </div>
          <div>
            <dt>Manual</dt>
            <dd>{percent(metricsSummary.manual_completion_rate)}</dd>
          </div>
          <div>
            <dt>Action</dt>
            <dd>{percent(metricsSummary.action_success_rate)}</dd>
          </div>
          <div>
            <dt>Poster</dt>
            <dd>{percent(metricsSummary.poster_generation_rate)}</dd>
          </div>
          <div>
            <dt>Negative</dt>
            <dd>{metricsSummary.negative_feedback_count}</dd>
          </div>
        </dl>
      ) : null}

      <dl className="metric-grid pilot-metrics">
        <div>
          <dt>Privacy scans</dt>
          <dd>{state.privacy_scans.filter((scan) => scan.passed).length}/{state.privacy_scans.length}</dd>
        </div>
        <div>
          <dt>DDL tables</dt>
          <dd>{postgresSchema.split("\n").length}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="Phase 10 metrics summary">
        <span>
          <BarChart3 size={15} aria-hidden="true" /> Controlled pilot only
        </span>
        <span>No public signup</span>
        <span>No billing</span>
        <span>No hardware SDK</span>
      </div>

      <p className="muted">{report.customer_feedback_summary}</p>
    </section>
  );
}
