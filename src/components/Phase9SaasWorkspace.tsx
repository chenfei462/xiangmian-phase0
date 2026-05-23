import {
  BarChart3,
  Building2,
  Database,
  FileClock,
  ShieldCheck
} from "lucide-react";
import type { JSX } from "react";

import type { AdminMetricsSnapshot } from "../lib/phase8-contracts";
import type {
  Phase9SaasReport,
  PublishedConfigSnapshot
} from "../lib/phase9-contracts";
import type { Phase9SaasState } from "../lib/phase9-saas";

type Phase9SaasWorkspaceProps = {
  activeTenantId: string;
  activeSnapshot: PublishedConfigSnapshot | null;
  metrics: AdminMetricsSnapshot;
  report: Phase9SaasReport;
  state: Phase9SaasState;
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function Phase9SaasWorkspace({
  activeTenantId,
  activeSnapshot,
  metrics,
  report,
  state
}: Phase9SaasWorkspaceProps): JSX.Element {
  const activeTenant = state.tenants.find((tenant) => tenant.tenant_id === activeTenantId);
  const activeAccounts = state.admin_accounts.filter((account) => account.tenant_id === activeTenantId);

  return (
    <section className="panel saas-workspace" aria-label="Phase 9 SaaS workspace">
      <div className="panel-title">
        <Building2 size={18} aria-hidden="true" />
        Phase 9 SaaS v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <dl className="metric-grid">
        <div>
          <dt>Tenant</dt>
          <dd>{activeTenant?.name ?? activeTenantId}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{activeTenant?.tenant_type ?? "unknown"}</dd>
        </div>
        <div>
          <dt>Accounts</dt>
          <dd>{activeAccounts.length}</dd>
        </div>
        <div>
          <dt>Policies</dt>
          <dd>{state.permission_policies.length}</dd>
        </div>
        <div>
          <dt>Snapshots</dt>
          <dd>{report.published_snapshot_count}</dd>
        </div>
        <div>
          <dt>Audits</dt>
          <dd>{report.audit_count}</dd>
        </div>
        <div>
          <dt>Migration</dt>
          <dd>{String(report.migration_check_passed)}</dd>
        </div>
        <div>
          <dt>Go/No-Go</dt>
          <dd>{report.go_no_go_decision}</dd>
        </div>
      </dl>

      <div className="admin-actions" aria-label="SaaS guardrails">
        <span>
          <Database size={15} aria-hidden="true" /> Published snapshot only
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Privacy:{" "}
          {String(report.privacy_check_passed)}
        </span>
        <span>
          <FileClock size={15} aria-hidden="true" /> Draft hidden from H5
        </span>
      </div>

      {activeSnapshot ? (
        <dl className="metric-grid saas-metrics">
          <div>
            <dt>Snapshot</dt>
            <dd>{activeSnapshot.snapshot_id}</dd>
          </div>
          <div>
            <dt>Config</dt>
            <dd>{activeSnapshot.config_version_id}</dd>
          </div>
          <div>
            <dt>Campaign</dt>
            <dd>{activeSnapshot.campaign_id}</dd>
          </div>
          <div>
            <dt>Blocklist</dt>
            <dd>{activeSnapshot.blocklist.length}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">当前活动没有 published snapshot，前台会使用本地兜底配置。</p>
      )}

      <dl className="metric-grid saas-metrics">
        <div>
          <dt>Completion</dt>
          <dd>{percent(metrics.completion_rate)}</dd>
        </div>
        <div>
          <dt>Manual</dt>
          <dd>{percent(metrics.manual_completion_rate)}</dd>
        </div>
        <div>
          <dt>Action</dt>
          <dd>{percent(metrics.action_success_rate)}</dd>
        </div>
        <div>
          <dt>Poster</dt>
          <dd>{percent(metrics.poster_generation_rate)}</dd>
        </div>
        <div>
          <dt>Share</dt>
          <dd>{percent(metrics.share_click_rate)}</dd>
        </div>
        <div>
          <dt>Negative</dt>
          <dd>{metrics.negative_feedback_count}</dd>
        </div>
      </dl>

      <p className="muted">
        SaaS v0.1 只开放内部和示例客户空间；公开 H5 只读取已发布快照，不读取后台草稿。
      </p>
    </section>
  );
}
