import {
  CalibrationResultSchema,
  ConsentStateSchema,
  MvpEventSchema,
  type CalibrationResult,
  type CardResult,
  type ConsentState,
  type MvpEvent,
  type MvpEventType,
  type MvpSessionState
} from "./mvp-contracts";
import type { FallbackReason } from "./phase4-contracts";
import { getFallbackMessage } from "./phase4-governance";

export type MvpSession = {
  state: MvpSessionState;
  started_at: number;
  last_updated_at: number;
  consent?: ConsentState;
  calibration?: CalibrationResult;
  result?: CardResult;
  events: MvpEvent[];
};

function event(
  eventType: MvpEventType,
  sessionStep: MvpSessionState,
  timestamp: number,
  extras: Partial<Pick<MvpEvent, "trigger" | "quality_score">> = {}
): MvpEvent {
  return MvpEventSchema.parse({
    event_type: eventType,
    session_step: sessionStep,
    timestamp,
    ...extras
  });
}

function withEvent(
  session: MvpSession,
  eventType: MvpEventType,
  state: MvpSessionState,
  timestamp: number,
  extras?: Partial<Pick<MvpEvent, "trigger" | "quality_score">>
): MvpSession {
  return {
    ...session,
    state,
    last_updated_at: timestamp,
    events: [...session.events, event(eventType, state, timestamp, extras)]
  };
}

export function createInitialMvpSession(timestamp = Date.now()): MvpSession {
  return {
    state: "entry",
    started_at: timestamp,
    last_updated_at: timestamp,
    events: [event("session_started", "entry", timestamp)]
  };
}

export function enterConsent(session: MvpSession, timestamp = Date.now()): MvpSession {
  return {
    ...session,
    state: "consent",
    last_updated_at: timestamp
  };
}

export function acknowledgePrivacyForCamera(
  session: MvpSession,
  timestamp = Date.now()
): MvpSession {
  const consent = ConsentStateSchema.parse({
    camera_allowed: true,
    privacy_acknowledged: true,
    manual_mode_selected: false,
    timestamp
  });

  return {
    ...withEvent(session, "camera_consent_granted", "camera_setup", timestamp),
    consent
  };
}

export function beginCalibration(session: MvpSession, timestamp = Date.now()): MvpSession {
  return {
    ...session,
    state: "calibration",
    last_updated_at: timestamp
  };
}

export function startManualMode(session: MvpSession, timestamp = Date.now()): MvpSession {
  const consent = ConsentStateSchema.parse({
    camera_allowed: false,
    privacy_acknowledged: true,
    manual_mode_selected: true,
    timestamp
  });

  return {
    ...withEvent(session, "manual_mode_selected", "drawing", timestamp),
    consent,
    calibration: {
      status: "skipped",
      quality_state: "camera_denied",
      quality_score: 0,
      duration_ms: 0,
      failure_reason: "用户选择手动抽卡"
    }
  };
}

export function completeCalibration(
  session: MvpSession,
  resultInput: CalibrationResult,
  timestamp = Date.now()
): MvpSession {
  const result = CalibrationResultSchema.parse(resultInput);
  const passed = result.status === "passed" && result.quality_state === "ready";

  return {
    ...withEvent(
      session,
      passed ? "calibration_passed" : "calibration_failed",
      passed ? "action_task" : "fallback",
      timestamp,
      { quality_score: result.quality_score }
    ),
    calibration: result
  };
}

export function fallbackToManual(
  session: MvpSession,
  reason: FallbackReason,
  timestamp = Date.now()
): MvpSession {
  const qualityStateByReason: Record<FallbackReason, CalibrationResult["quality_state"]> = {
    camera_denied: "camera_denied",
    model_error: "model_error",
    no_face: "no_face",
    multi_face: "multi_face",
    low_light: "low_light",
    off_center: "off_center",
    loading_timeout: "loading_timeout",
    action_timeout: "model_error",
    no_card_candidate: "model_error"
  };

  return {
    ...withEvent(session, "fallback_manual_available", "fallback", timestamp),
    calibration:
      session.calibration ??
      CalibrationResultSchema.parse({
        status: "failed",
        quality_state: qualityStateByReason[reason],
        quality_score: 0,
        duration_ms: 0,
        failure_reason: getFallbackMessage(reason)
      })
  };
}

export function markActionDetected(
  session: MvpSession,
  trigger: MvpEvent["trigger"],
  qualityScore: number,
  timestamp = Date.now()
): MvpSession {
  return withEvent(session, "action_detected", "drawing", timestamp, {
    trigger,
    quality_score: qualityScore
  });
}

export function attachCardResult(
  session: MvpSession,
  result: CardResult,
  timestamp = Date.now()
): MvpSession {
  return {
    ...withEvent(session, "card_drawn", "result", timestamp, {
      trigger: result.trigger
    }),
    result
  };
}

export function exitMvpSession(session: MvpSession, timestamp = Date.now()): MvpSession {
  return {
    state: "exit",
    started_at: session.started_at,
    last_updated_at: timestamp,
    events: []
  };
}
