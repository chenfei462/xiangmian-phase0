import { describe, expect, it, vi } from "vitest";

import type { FaceLandmarker } from "../src/lib/vision-model";
import { loadMediaPipeFaceLandmarker } from "../src/lib/vision-model";
import { renderPosterPngDataUrl } from "../src/lib/poster-renderer";
import { createPhase7PosterRenderModel, drawPhase7CardResultForEvent } from "../src/lib/phase7-registry";
import { attachCardResult, createInitialMvpSession, markActionDetected, startManualMode } from "../src/lib/mvp-flow";
import type { VisionEvent } from "../src/lib/contracts";

function event(type: VisionEvent["type"], timestamp = 1770000000000): VisionEvent {
  return {
    type,
    confidence: 0.9,
    quality_score: 0.86,
    timestamp
  };
}

describe("P0 camera fallback and draw loop", () => {
  it("reports MediaPipe model loading timeout distinctly from model errors", async () => {
    await expect(
      loadMediaPipeFaceLandmarker({
        timeoutMs: 1,
        importVision: () => new Promise(() => undefined)
      })
    ).rejects.toMatchObject({
      name: "MediaPipeLoadTimeoutError",
      reason: "loading_timeout"
    });
  });

  it("routes manual and action draw through the same card_drawn result state", () => {
    const manualResult = drawPhase7CardResultForEvent("CMP-001", event("manual_draw"));
    const actionResult = drawPhase7CardResultForEvent("CMP-001", event("smile"));

    expect(manualResult).not.toBeNull();
    expect(actionResult).not.toBeNull();

    const manualSession = attachCardResult(
      startManualMode(createInitialMvpSession(1000), 1100),
      manualResult!,
      1200
    );
    const actionSession = attachCardResult(
      markActionDetected(createInitialMvpSession(1000), "smile", 0.86, 1100),
      actionResult!,
      1200
    );

    for (const session of [manualSession, actionSession]) {
      expect(session.state).toBe("result");
      expect(session.events.at(-1)).toMatchObject({
        event_type: "card_drawn",
        session_step: "result"
      });
      expect(session.result?.safe_title.length).toBeGreaterThan(0);
      expect(session.result?.action_suggestion.length).toBeGreaterThan(0);
      expect(session.result?.disclaimer_required).toBe(true);
    }
  });
});

describe("P0 poster renderer", () => {
  it("renders a downloadable PNG data URL without raw face sources", async () => {
    const result = drawPhase7CardResultForEvent("CMP-001", event("manual_draw"));

    expect(result).not.toBeNull();

    const poster = createPhase7PosterRenderModel("CMP-001", result!, "action");
    const dataUrl = await renderPosterPngDataUrl(poster, {
      createCanvas: () => {
        const context = {
          fillStyle: "",
          font: "",
          textAlign: "left" as CanvasTextAlign,
          textBaseline: "alphabetic" as CanvasTextBaseline,
          fillRect: vi.fn(),
          fillText: vi.fn(),
          measureText: (text: string) => ({ width: text.length * 12 }),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          quadraticCurveTo: vi.fn(),
          closePath: vi.fn(),
          fill: vi.fn()
        } as unknown as CanvasRenderingContext2D;

        return {
          width: 0,
          height: 0,
          getContext: () => context,
          toDataURL: () => "data:image/png;base64,UE5HLVBPU1RFUg=="
        } as unknown as HTMLCanvasElement;
      }
    });

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl).not.toContain("video");
    expect(dataUrl).not.toContain("face");
    expect(dataUrl.length).toBeGreaterThan("data:image/png;base64,".length);
  });
});
