import {
  BarChart3,
  ClipboardCheck,
  Database,
  FileJson,
  ShieldCheck
} from "lucide-react";
import type { JSX } from "react";

import {
  ADMIN_USER_ROLES,
  type AdminConfigStore,
  type AdminUserRole,
  type ConfigVersion,
  type Phase8AdminReport
} from "../lib/phase8-contracts";

type Phase8AdminWorkspaceProps = {
  activeCampaignId: string;
  adminNotice: string;
  configVersion: ConfigVersion;
  exportSize: number;
  report: Phase8AdminReport;
  selectedRole: AdminUserRole;
  store: AdminConfigStore;
  onBlockCard: () => void;
  onRoleChange: (role: AdminUserRole) => void;
  onUnblockCard: () => void;
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function Phase8AdminWorkspace({
  activeCampaignId,
  adminNotice,
  configVersion,
  exportSize,
  report,
  selectedRole,
  store,
  onBlockCard,
  onRoleChange,
  onUnblockCard
}: Phase8AdminWorkspaceProps): JSX.Element {
  const activeMetrics = store.metrics_fixtures.find((metric) => metric.campaign_id === activeCampaignId);
  const releaseGatePassCount = store.release_gates.filter((gate) => gate.status === "pass").length;

  return (
    <section className="panel admin-workspace" aria-label="Phase 8 admin workspace">
      <div className="panel-title">
        <ClipboardCheck size={18} aria-hidden="true" />
        Phase 8 Admin v0.1
      </div>
      <p className="muted">模拟运营工作区 / published snapshot 预览；未接真实登录、数据库或生产 API。</p>

      <div className="admin-role-grid" aria-label="Simulated admin role">
        {ADMIN_USER_ROLES.map((role) => (
          <button
            className={selectedRole === role ? "active" : ""}
            type="button"
            key={role}
            onClick={() => onRoleChange(role)}
            aria-label={`admin role ${role}`}
            data-testid={`admin-role-${role}`}
          >
            {role}
          </button>
        ))}
      </div>

      <dl className="metric-grid">
        <div>
          <dt>Config</dt>
          <dd>{configVersion.version_id}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{configVersion.status}</dd>
        </div>
        <div>
          <dt>Themes</dt>
          <dd>{store.themes.length}</dd>
        </div>
        <div>
          <dt>Campaigns</dt>
          <dd>{store.campaigns.length}</dd>
        </div>
        <div>
          <dt>Release gates</dt>
          <dd>
            {releaseGatePassCount}/{store.release_gates.length}
          </dd>
        </div>
        <div>
          <dt>Blocklist</dt>
          <dd>{report.blocked_card_count}</dd>
        </div>
        <div>
          <dt>Audit logs</dt>
          <dd>{report.audit_count}</dd>
        </div>
        <div>
          <dt>Export</dt>
          <dd>{exportSize} bytes</dd>
        </div>
      </dl>

      <div className="button-row">
        <button
          className="secondary-button"
          type="button"
          onClick={onBlockCard}
          disabled={selectedRole === "viewer"}
          title="Block the first active campaign card in the local admin config"
          aria-label="admin block card"
          data-testid="admin-block-card-button"
        >
          <ShieldCheck size={18} aria-hidden="true" />
          Block card
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={onUnblockCard}
          disabled={selectedRole === "viewer" || store.card_blocklist.length === 0}
          title="Unblock the newest locally blocked card"
          aria-label="admin unblock card"
          data-testid="admin-unblock-card-button"
        >
          <FileJson size={18} aria-hidden="true" />
          Unblock
        </button>
      </div>

      <div className="admin-actions" aria-label="Admin config surfaces">
        <span>
          <Database size={15} aria-hidden="true" /> Config store
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" /> Privacy pass:{" "}
          {String(report.privacy_check_passed)}
        </span>
        <span>
          <BarChart3 size={15} aria-hidden="true" /> Go/No-Go:{" "}
          {report.go_no_go_decision}
        </span>
      </div>

      {activeMetrics ? (
        <dl className="metric-grid admin-metrics">
          <div>
            <dt>Completion</dt>
            <dd>{percent(activeMetrics.completion_rate)}</dd>
          </div>
          <div>
            <dt>Manual</dt>
            <dd>{percent(activeMetrics.manual_completion_rate)}</dd>
          </div>
          <div>
            <dt>Action</dt>
            <dd>{percent(activeMetrics.action_success_rate)}</dd>
          </div>
          <div>
            <dt>Poster</dt>
            <dd>{percent(activeMetrics.poster_generation_rate)}</dd>
          </div>
        </dl>
      ) : null}

      <p className="muted">{adminNotice}</p>
    </section>
  );
}
