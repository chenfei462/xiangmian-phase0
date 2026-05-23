import { describe, expect, it } from "vitest";

import { VISION_EVENT_TYPES, VisionEventSchema } from "../src/lib/contracts";
import {
  ActionThresholdsSchema,
  DEFAULT_ACTION_THRESHOLDS,
  FaceFeaturesSchema,
  VisionPrototypeReportSchema,
  VisionQualityStateSchema
} from "../src/lib/vision-contracts";
import { ActionDetector } from "../src/lib/vision-actions";
import { evaluateVisionQuality, extractFaceFeatures } from "../src/lib/vision-features";
import { PerformanceSampler } from "../src/lib/vision-performance";
import { selectPhase2CardForVisionEvent } from "../src/lib/vision-card-selector";

type Category = {
  categoryName: string;
  score: number;
};

function categories(values: Record<string, number>): Category[] {
  return Object.entries(values).map(([categoryName, score]) => ({ categoryName, score }));
}

function landmarks(count = 468): Array<{ x: number; y: number; z: number }> {
  return Array.from({ length: count }, (_, index) => ({
    x: 0.42 + (index % 12) * 0.01,
    y: 0.38 + (index % 10) * 0.01,
    z: 0
  }));
}

function featuresFromBlendshapes(values: Record<string, number>, yaw = 0) {
  return extractFaceFeatures(
    {
      faceLandmarks: [landmarks()],
      faceBlendshapes: [{ categories: categories(values) }],
      facialTransformationMatrixes: [
        {
          data: [
            Math.cos((yaw * Math.PI) / 180),
            0,
            Math.sin((yaw * Math.PI) / 180),
            0,
            0,
            1,
            0,
            0,
            -Math.sin((yaw * Math.PI) / 180),
            0,
            Math.cos((yaw * Math.PI) / 180),
            0,
            0,
            0,
            0,
            1
          ]
        }
      ]
    },
    18
  );
}

describe("phase 2 vision contracts", () => {
  it("extends VisionEvent v0.2 with eyes_closed", () => {
    expect(VISION_EVENT_TYPES).toContain("eyes_closed");
    expect(
      VisionEventSchema.safeParse({
        type: "eyes_closed",
        confidence: 0.91,
        quality_score: 0.84,
        timestamp: 1770000000000
      }).success
    ).toBe(true);
  });

  it("validates face features, thresholds, quality states, and prototype reports", () => {
    expect(() =>
      FaceFeaturesSchema.parse({
        face_count: 1,
        landmark_count: 468,
        blendshapes: { eyeBlinkLeft: 0.1 },
        yaw: 0,
        pitch: 0,
        roll: 0,
        quality_score: 0.86,
        frame_time_ms: 18
      })
    ).not.toThrow();
    expect(() => ActionThresholdsSchema.parse(DEFAULT_ACTION_THRESHOLDS)).not.toThrow();
    expect(() => VisionQualityStateSchema.parse("ready")).not.toThrow();
    expect(() =>
      VisionPrototypeReportSchema.parse({
        device: "Desktop",
        browser: "Chrome",
        average_frame_time_ms: 28,
        action_success_rate: 0.92,
        failure_reasons: { no_face: 1 },
        go_no_go: "go"
      })
    ).not.toThrow();
  });
});

describe("phase 2 feature adapter and action detector", () => {
  it("extracts normalized face features from MediaPipe output", () => {
    const features = featuresFromBlendshapes({ mouthSmileLeft: 0.72, mouthSmileRight: 0.7 }, 24);

    expect(features.face_count).toBe(1);
    expect(features.landmark_count).toBe(468);
    expect(features.blendshapes.mouthSmileLeft).toBe(0.72);
    expect(features.yaw).toBeGreaterThan(20);
    expect(features.frame_time_ms).toBe(18);
    expect(features.quality_score).toBeGreaterThan(0.7);
  });

  it("classifies no-face, multi-face, low-light, off-center, and ready states", () => {
    expect(evaluateVisionQuality(extractFaceFeatures({ faceLandmarks: [] }, 16))).toBe("no_face");
    expect(evaluateVisionQuality(extractFaceFeatures({ faceLandmarks: [landmarks(), landmarks()] }, 16))).toBe(
      "multi_face"
    );
    expect(evaluateVisionQuality(extractFaceFeatures({ faceLandmarks: [landmarks(20)] }, 16))).toBe("low_light");
    expect(evaluateVisionQuality(featuresFromBlendshapes({}, 38))).toBe("off_center");
    expect(evaluateVisionQuality(featuresFromBlendshapes({ mouthSmileLeft: 0.1 }, 0))).toBe("ready");
  });

  it("detects seven action events from thresholded feature frames", () => {
    const cases = [
      ["blink", featuresFromBlendshapes({ eyeBlinkLeft: 0.72, eyeBlinkRight: 0.72 })],
      ["smile", featuresFromBlendshapes({ mouthSmileLeft: 0.72, mouthSmileRight: 0.7 })],
      ["brow_up", featuresFromBlendshapes({ browOuterUpLeft: 0.68, browOuterUpRight: 0.66 })],
      ["mouth_open", featuresFromBlendshapes({ jawOpen: 0.62 })],
      ["head_turn", featuresFromBlendshapes({}, 28)]
    ] as const;

    for (const [expectedType, features] of cases) {
      const detector = new ActionDetector(DEFAULT_ACTION_THRESHOLDS);
      expect(detector.update(features, 1000)?.type).toBe(expectedType);
    }

    const closedDetector = new ActionDetector(DEFAULT_ACTION_THRESHOLDS);
    const closedFrame = featuresFromBlendshapes({ eyeBlinkLeft: 0.92, eyeBlinkRight: 0.92 });
    expect(closedDetector.update(closedFrame, 1000)?.type).toBe("blink");
    expect(closedDetector.update(closedFrame, 2100)?.type).toBe("eyes_closed");

    const stableDetector = new ActionDetector(DEFAULT_ACTION_THRESHOLDS);
    const stableFrame = featuresFromBlendshapes({ eyeBlinkLeft: 0.05, eyeBlinkRight: 0.05 });
    expect(stableDetector.update(stableFrame, 1000)).toBeNull();
    expect(stableDetector.update(stableFrame, 3100)?.type).toBe("look_stable");
  });
});

describe("phase 2 performance and knowledge handoff", () => {
  it("samples frame-time and FPS for the debug panel", () => {
    const sampler = new PerformanceSampler(5);
    sampler.recordFrame(20);
    sampler.recordFrame(30);
    sampler.recordFrame(25);

    const snapshot = sampler.getSnapshot();
    expect(snapshot.average_frame_time_ms).toBe(25);
    expect(snapshot.fps).toBe(40);
    expect(snapshot.sample_count).toBe(3);
  });

  it("selects a publishable phase 1 card for every phase 2 action", () => {
    for (const type of VISION_EVENT_TYPES) {
      const selected = selectPhase2CardForVisionEvent({
        type,
        confidence: 0.88,
        quality_score: 0.9,
        timestamp: 1770000000000
      });

      expect(selected?.review_status).toBe("approved");
      expect(selected?.risk_level).toMatch(/A|B/);
    }
  });
});
