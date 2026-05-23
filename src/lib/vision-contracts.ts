import { z } from "zod";

export const VisionQualityStateSchema = z.enum([
  "ready",
  "no_face",
  "multi_face",
  "low_light",
  "off_center",
  "model_error",
  "loading_timeout",
  "camera_denied"
]);

export const FaceFeaturesSchema = z.object({
  face_count: z.number().int().min(0),
  landmark_count: z.number().int().min(0),
  blendshapes: z.record(z.string(), z.number().min(0).max(1)),
  yaw: z.number(),
  pitch: z.number(),
  roll: z.number(),
  quality_score: z.number().min(0).max(1),
  frame_time_ms: z.number().min(0)
});

export const ActionThresholdsSchema = z.object({
  blink_score: z.number().min(0).max(1),
  smile_score: z.number().min(0).max(1),
  brow_up_score: z.number().min(0).max(1),
  mouth_open_score: z.number().min(0).max(1),
  head_turn_yaw_degrees: z.number().positive(),
  eyes_closed_score: z.number().min(0).max(1),
  eyes_closed_duration_ms: z.number().int().positive(),
  look_stable_duration_ms: z.number().int().positive(),
  min_quality_score: z.number().min(0).max(1),
  off_center_yaw_degrees: z.number().positive(),
  off_center_pitch_degrees: z.number().positive()
});

export const DEFAULT_ACTION_THRESHOLDS = ActionThresholdsSchema.parse({
  blink_score: 0.45,
  smile_score: 0.35,
  brow_up_score: 0.35,
  mouth_open_score: 0.35,
  head_turn_yaw_degrees: 24,
  eyes_closed_score: 0.82,
  eyes_closed_duration_ms: 1000,
  look_stable_duration_ms: 2000,
  min_quality_score: 0.6,
  off_center_yaw_degrees: 34,
  off_center_pitch_degrees: 24
});

export const VisionPrototypeReportSchema = z.object({
  device: z.string().min(1),
  browser: z.string().min(1),
  average_frame_time_ms: z.number().min(0),
  action_success_rate: z.number().min(0).max(1),
  failure_reasons: z.record(z.string(), z.number().int().nonnegative()),
  go_no_go: z.enum(["go", "hold", "no-go"])
});

export type VisionQualityState = z.infer<typeof VisionQualityStateSchema>;
export type FaceFeatures = z.infer<typeof FaceFeaturesSchema>;
export type ActionThresholds = z.infer<typeof ActionThresholdsSchema>;
export type VisionPrototypeReport = z.infer<typeof VisionPrototypeReportSchema>;
