import { describe, expect, it } from "vitest";

import { VISION_EVENT_TYPES, type VisionEvent } from "../src/lib/contracts";
import {
  CalibrationResultSchema,
  CardResultSchema,
  ConsentStateSchema,
  MvpEventSchema,
  MVP_SESSION_STATES,
  RESULT_TONES
} from "../src/lib/mvp-contracts";
import {
  acknowledgePrivacyForCamera,
  beginCalibration,
  completeCalibration,
  createInitialMvpSession,
  enterConsent,
  exitMvpSession,
  fallbackToManual,
  startManualMode
} from "../src/lib/mvp-flow";
import { drawMvpCardForEvent, renderResultTone } from "../src/lib/mvp-card-result";
import { scanUnsafeClaims } from "../src/lib/rules";

function event(type: VisionEvent["type"], timestamp = 1770000000000): VisionEvent {
  return {
    type,
    confidence: 0.88,
    quality_score: 0.9,
    timestamp
  };
}

describe("phase 3 MVP contracts", () => {
  it("defines MVP session states and result tones", () => {
    expect(MVP_SESSION_STATES).toEqual([
      "entry",
      "consent",
      "camera_setup",
      "calibration",
      "action_task",
      "drawing",
      "result",
      "fallback",
      "exit"
    ]);
    expect(RESULT_TONES).toEqual(["classic", "light", "action"]);
  });

  it("validates consent, calibration, card result, and anonymous event shapes", () => {
    expect(() =>
      ConsentStateSchema.parse({
        camera_allowed: true,
        privacy_acknowledged: true,
        manual_mode_selected: false,
        timestamp: 1770000000000
      })
    ).not.toThrow();
    expect(() =>
      CalibrationResultSchema.parse({
        status: "passed",
        quality_state: "ready",
        quality_score: 0.86,
        duration_ms: 3000,
        failure_reason: null
      })
    ).not.toThrow();
    expect(() =>
      CardResultSchema.parse({
        card_id: "CARD-KB-001",
        term_id: "TERM-001",
        trigger: "smile",
        source_id: "SRC-001",
        safe_title: "眉眼舒展",
        safe_copy: "以轻松的姿态开始一次观察。",
        modern_gloss: "用于描述表情给人的温和印象。",
        action_suggestion: "先把呼吸放慢，再整理当下任务。",
        disclaimer_required: true
      })
    ).not.toThrow();
    expect(
      MvpEventSchema.safeParse({
        event_type: "action_detected",
        session_step: "action_task",
        trigger: "smile",
        quality_score: 0.8,
        timestamp: 1770000000000,
        raw_image: "data:image/png;base64,unsafe"
      }).success
    ).toBe(false);
  });
});

describe("phase 3 MVP session flow", () => {
  it("opens a dedicated consent step before camera setup", () => {
    const session = enterConsent(createInitialMvpSession(1000), 1050);

    expect(session.state).toBe("consent");
    expect(session.consent).toBeUndefined();
    expect(session.last_updated_at).toBe(1050);
  });

  it("moves from entry to camera setup after privacy consent", () => {
    const session = acknowledgePrivacyForCamera(createInitialMvpSession(1000), 1100);

    expect(session.state).toBe("camera_setup");
    expect(session.consent?.camera_allowed).toBe(true);
    expect(session.consent?.privacy_acknowledged).toBe(true);
    expect(session.events.at(-1)?.event_type).toBe("camera_consent_granted");
  });

  it("enters calibration after camera setup", () => {
    const session = beginCalibration(
      acknowledgePrivacyForCamera(createInitialMvpSession(1000), 1100),
      1400
    );

    expect(session.state).toBe("calibration");
    expect(session.last_updated_at).toBe(1400);
  });

  it("supports manual mode without camera permission", () => {
    const session = startManualMode(createInitialMvpSession(1000), 1200);

    expect(session.state).toBe("drawing");
    expect(session.consent?.camera_allowed).toBe(false);
    expect(session.consent?.manual_mode_selected).toBe(true);
  });

  it("sends passed calibration to the action task and failed calibration to fallback", () => {
    const cameraSession = acknowledgePrivacyForCamera(createInitialMvpSession(1000), 1100);
    const passed = completeCalibration(
      cameraSession,
      {
        status: "passed",
        quality_state: "ready",
        quality_score: 0.82,
        duration_ms: 3000,
        failure_reason: null
      },
      4100
    );
    const failed = completeCalibration(
      cameraSession,
      {
        status: "failed",
        quality_state: "low_light",
        quality_score: 0.32,
        duration_ms: 3000,
        failure_reason: "环境光不足"
      },
      4100
    );

    expect(passed.state).toBe("action_task");
    expect(failed.state).toBe("fallback");
  });

  it("falls back to manual draw and clears transient data on exit", () => {
    const fallback = fallbackToManual(
      acknowledgePrivacyForCamera(createInitialMvpSession(1000), 1100),
      "camera_denied",
      1200
    );
    const exited = exitMvpSession(fallback, 9000);

    expect(fallback.state).toBe("fallback");
    expect(exited.state).toBe("exit");
    expect(exited.consent).toBeUndefined();
    expect(exited.calibration).toBeUndefined();
    expect(exited.result).toBeUndefined();
    expect(exited.events).toEqual([]);
  });
});

describe("phase 3 MVP card results", () => {
  it("draws a safe approved card result for every vision trigger", () => {
    for (const type of VISION_EVENT_TYPES) {
      const result = drawMvpCardForEvent(event(type));

      expect(result).not.toBeNull();
      expect(result?.disclaimer_required).toBe(true);
      expect(result?.safe_title.length).toBeGreaterThan(0);
      expect(result?.modern_gloss.length).toBeGreaterThan(0);
      expect(scanUnsafeClaims(`${result?.safe_copy}${result?.action_suggestion}`)).toEqual([]);
    }
  });

  it("renders classic, light, and action tones without changing the card identity", () => {
    const result = drawMvpCardForEvent(event("smile"));

    expect(result).not.toBeNull();

    const classic = renderResultTone(result!, "classic");
    const light = renderResultTone(result!, "light");
    const action = renderResultTone(result!, "action");

    expect(classic.card_id).toBe(result?.card_id);
    expect(light.card_id).toBe(result?.card_id);
    expect(action.card_id).toBe(result?.card_id);
    expect(new Set([classic.copy, light.copy, action.copy]).size).toBe(3);
    expect(scanUnsafeClaims(`${classic.copy}${light.copy}${action.copy}`)).toEqual([]);
  });
});
