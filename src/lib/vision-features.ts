import { FaceFeaturesSchema, type ActionThresholds, type FaceFeatures, type VisionQualityState } from "./vision-contracts";
import { DEFAULT_ACTION_THRESHOLDS } from "./vision-contracts";

export type BlendshapeCategory = {
  categoryName: string;
  score: number;
};

type Landmark = {
  x: number;
  y: number;
  z?: number;
};

type TransformMatrix = number[] | { data: number[] };

export type FaceLandmarkerResult = {
  faceLandmarks: Landmark[][];
  faceBlendshapes?: Array<{ categories: BlendshapeCategory[] }>;
  facialTransformationMatrixes?: TransformMatrix[];
};

function transformData(matrix: TransformMatrix | undefined): number[] | null {
  if (!matrix) {
    return null;
  }

  return Array.isArray(matrix) ? matrix : matrix.data;
}

function degrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function extractPose(matrix: TransformMatrix | undefined): { yaw: number; pitch: number; roll: number } {
  const data = transformData(matrix);

  if (!data || data.length < 11) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  return {
    yaw: Number(degrees(Math.atan2(data[2], data[0])).toFixed(2)),
    pitch: Number(degrees(Math.atan2(-data[6], Math.sqrt(data[0] * data[0] + data[1] * data[1]))).toFixed(2)),
    roll: Number(degrees(Math.atan2(data[4], data[5])).toFixed(2))
  };
}

function normalizeBlendshapes(categories: BlendshapeCategory[]): Record<string, number> {
  return Object.fromEntries(
    categories.map((category) => [
      category.categoryName,
      Number(Math.max(0, Math.min(1, category.score)).toFixed(3))
    ])
  );
}

function qualityScore(faceCount: number, landmarkCount: number, blendshapeCount: number): number {
  if (faceCount === 0) {
    return 0;
  }

  if (faceCount > 1) {
    return 0.35;
  }

  const landmarkRatio = Math.min(1, landmarkCount / 468);
  const blendshapeBonus = blendshapeCount > 0 ? 0.08 : 0;

  return Number(Math.min(1, 0.25 + landmarkRatio * 0.65 + blendshapeBonus).toFixed(2));
}

export function extractFaceFeatures(result: FaceLandmarkerResult, frameTimeMs: number): FaceFeatures {
  const faceCount = result.faceLandmarks.length;
  const landmarkCount = result.faceLandmarks[0]?.length ?? 0;
  const categories = result.faceBlendshapes?.[0]?.categories ?? [];
  const pose = extractPose(result.facialTransformationMatrixes?.[0]);

  return FaceFeaturesSchema.parse({
    face_count: faceCount,
    landmark_count: landmarkCount,
    blendshapes: normalizeBlendshapes(categories),
    yaw: pose.yaw,
    pitch: pose.pitch,
    roll: pose.roll,
    quality_score: qualityScore(faceCount, landmarkCount, categories.length),
    frame_time_ms: Number(frameTimeMs.toFixed(2))
  });
}

export function blendshapeScore(features: FaceFeatures, name: string): number {
  return features.blendshapes[name] ?? 0;
}

export function evaluateVisionQuality(
  features: FaceFeatures,
  thresholds: ActionThresholds = DEFAULT_ACTION_THRESHOLDS
): VisionQualityState {
  if (features.face_count === 0) {
    return "no_face";
  }

  if (features.face_count > 1) {
    return "multi_face";
  }

  if (features.quality_score < thresholds.min_quality_score) {
    return "low_light";
  }

  if (
    Math.abs(features.yaw) > thresholds.off_center_yaw_degrees ||
    Math.abs(features.pitch) > thresholds.off_center_pitch_degrees
  ) {
    return "off_center";
  }

  return "ready";
}
