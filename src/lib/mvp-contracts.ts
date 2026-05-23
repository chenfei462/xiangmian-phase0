import { z } from "zod";

import { VISION_EVENT_TYPES } from "./contracts";
import { VisionQualityStateSchema } from "./vision-contracts";

export const MVP_SESSION_STATES = [
  "entry",
  "consent",
  "camera_setup",
  "calibration",
  "action_task",
  "drawing",
  "result",
  "fallback",
  "exit"
] as const;

export const RESULT_TONES = ["classic", "light", "action"] as const;

export const MVP_EVENT_TYPES = [
  "session_started",
  "camera_consent_granted",
  "manual_mode_selected",
  "calibration_passed",
  "calibration_failed",
  "fallback_manual_available",
  "action_detected",
  "card_drawn",
  "result_viewed",
  "session_exited"
] as const;

export const MvpSessionStateSchema = z.enum(MVP_SESSION_STATES);

export const ResultToneSchema = z.enum(RESULT_TONES);

export const ConsentStateSchema = z
  .object({
    camera_allowed: z.boolean(),
    privacy_acknowledged: z.boolean(),
    manual_mode_selected: z.boolean(),
    timestamp: z.number().int().nonnegative()
  })
  .strict();

export const CalibrationResultSchema = z
  .object({
    status: z.enum(["passed", "failed", "skipped"]),
    quality_state: VisionQualityStateSchema,
    quality_score: z.number().min(0).max(1),
    duration_ms: z.number().int().nonnegative(),
    failure_reason: z.string().min(1).nullable()
  })
  .strict();

export const CardResultSchema = z
  .object({
    card_id: z.string().regex(/^CARD-KB-\d{3}$/),
    term_id: z.string().regex(/^TERM-\d{3}$/),
    trigger: z.enum(VISION_EVENT_TYPES),
    source_id: z.string().regex(/^SRC-\d{3}$/),
    safe_title: z.string().min(1),
    safe_copy: z.string().min(1),
    modern_gloss: z.string().min(1),
    action_suggestion: z.string().min(1),
    disclaimer_required: z.literal(true)
  })
  .strict();

export const MvpEventSchema = z
  .object({
    event_type: z.enum(MVP_EVENT_TYPES),
    session_step: MvpSessionStateSchema,
    trigger: z.enum(VISION_EVENT_TYPES).optional(),
    quality_score: z.number().min(0).max(1).optional(),
    timestamp: z.number().int().nonnegative()
  })
  .strict();

export type MvpSessionState = z.infer<typeof MvpSessionStateSchema>;
export type ResultTone = z.infer<typeof ResultToneSchema>;
export type MvpEventType = (typeof MVP_EVENT_TYPES)[number];
export type ConsentState = z.infer<typeof ConsentStateSchema>;
export type CalibrationResult = z.infer<typeof CalibrationResultSchema>;
export type CardResult = z.infer<typeof CardResultSchema>;
export type MvpEvent = z.infer<typeof MvpEventSchema>;
