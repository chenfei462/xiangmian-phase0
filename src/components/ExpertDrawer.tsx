import { XCircle } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export const EXPERT_DRAWER_TABS = ["debug", "ops", "phase"] as const;
export type ExpertDrawerTab = (typeof EXPERT_DRAWER_TABS)[number];

export const EXPERT_DRAWER_PHASE_PANELS = [
  "phase8",
  "phase9",
  "phase10",
  "phase11",
  "phase12",
  "phase13",
  "phase14",
  "phase15"
] as const;
export type ExpertDrawerPhasePanel = (typeof EXPERT_DRAWER_PHASE_PANELS)[number];

const TAB_LABELS: Record<ExpertDrawerTab, string> = {
  debug: "联调",
  ops: "运营",
  phase: "Phase"
};

const PHASE_LABELS: Record<ExpertDrawerPhasePanel, string> = {
  phase8: "Phase 8",
  phase9: "Phase 9",
  phase10: "Phase 10",
  phase11: "Phase 11",
  phase12: "Phase 12",
  phase13: "Phase 13",
  phase14: "Phase 14",
  phase15: "Phase 15"
};

type ExpertDrawerProps = {
  activePhasePanel: ExpertDrawerPhasePanel;
  activeTab: ExpertDrawerTab;
  debugContent: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onPhasePanelChange: (panel: ExpertDrawerPhasePanel) => void;
  onTabChange: (tab: ExpertDrawerTab) => void;
  opsContent: ReactNode;
  phaseContent: Record<ExpertDrawerPhasePanel, ReactNode>;
};

export function ExpertDrawer({
  activePhasePanel,
  activeTab,
  debugContent,
  isOpen,
  onClose,
  onPhasePanelChange,
  onTabChange,
  opsContent,
  phaseContent
}: ExpertDrawerProps): React.JSX.Element | null {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const content =
    activeTab === "debug"
      ? debugContent
      : activeTab === "ops"
        ? opsContent
        : (
            <>
              <div className="expert-phase-switch" role="tablist" aria-label="Phase 工作台切换">
                {EXPERT_DRAWER_PHASE_PANELS.map((panel) => (
                  <button
                    className={activePhasePanel === panel ? "active" : ""}
                    type="button"
                    role="tab"
                    aria-selected={activePhasePanel === panel}
                    key={panel}
                    onClick={() => onPhasePanelChange(panel)}
                  >
                    {PHASE_LABELS[panel]}
                  </button>
                ))}
              </div>
              <div className="expert-phase-panel">{phaseContent[activePhasePanel]}</div>
            </>
          );

  return (
    <div className="expert-drawer-layer">
      <button
        className="expert-drawer-backdrop"
        type="button"
        aria-label="关闭专家模式"
        onClick={onClose}
      />
      <aside className="expert-drawer" role="dialog" aria-modal="true" aria-label="专家模式">
        <div className="expert-drawer-header">
          <div>
            <p className="eyebrow">Expert Mode</p>
            <h2>专家模式</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭专家模式">
            <XCircle size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="expert-tab-strip" role="tablist" aria-label="专家模式分区">
          {EXPERT_DRAWER_TABS.map((tab) => (
            <button
              className={activeTab === tab ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              key={tab}
              onClick={() => onTabChange(tab)}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        <div className="expert-drawer-content">{content}</div>
      </aside>
    </div>
  );
}
