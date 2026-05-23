import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  ExpertDrawer,
  type ExpertDrawerPhasePanel,
  type ExpertDrawerTab
} from "../src/components/ExpertDrawer";

const phasePanels: Record<ExpertDrawerPhasePanel, string> = {
  phase8: "Phase 8 panel",
  phase9: "Phase 9 panel",
  phase10: "Phase 10 panel",
  phase11: "Phase 11 panel",
  phase12: "Phase 12 panel",
  phase13: "Phase 13 panel",
  phase14: "Phase 14 panel",
  phase15: "Phase 15 panel"
};

function renderDrawer(activeTab: ExpertDrawerTab, activePhasePanel: ExpertDrawerPhasePanel): string {
  return renderToStaticMarkup(
    <ExpertDrawer
      activePhasePanel={activePhasePanel}
      activeTab={activeTab}
      debugContent={<div>Debug tools</div>}
      isOpen={true}
      onClose={vi.fn()}
      onPhasePanelChange={vi.fn()}
      onTabChange={vi.fn()}
      opsContent={<div>Ops dashboard</div>}
      phaseContent={Object.fromEntries(
        Object.entries(phasePanels).map(([key, value]) => [key, <div>{value}</div>])
      ) as Record<ExpertDrawerPhasePanel, React.ReactNode>}
    />
  );
}

describe("ExpertDrawer", () => {
  it("renders only the active top-level tab content", () => {
    const debugMarkup = renderDrawer("debug", "phase15");
    expect(debugMarkup).toContain("Debug tools");
    expect(debugMarkup).not.toContain("Ops dashboard");
    expect(debugMarkup).not.toContain("Phase 15 panel");

    const opsMarkup = renderDrawer("ops", "phase15");
    expect(opsMarkup).toContain("Ops dashboard");
    expect(opsMarkup).not.toContain("Debug tools");
    expect(opsMarkup).not.toContain("Phase 15 panel");
  });

  it("renders only the selected phase panel inside the phase tab", () => {
    const markup = renderDrawer("phase", "phase13");

    expect(markup).toContain("Phase 13 panel");
    expect(markup).not.toContain("Phase 12 panel");
    expect(markup).not.toContain("Phase 14 panel");
  });
});
