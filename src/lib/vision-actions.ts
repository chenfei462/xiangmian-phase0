import type { VisionEvent, VisionEventType } from "./contracts";
import { blendshapeScore, evaluateVisionQuality } from "./vision-features";
import {
  DEFAULT_ACTION_THRESHOLDS,
  type ActionThresholds,
  type FaceFeatures
} from "./vision-contracts";

function roundScore(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

function makeEvent(
  type: VisionEventType,
  confidence: number,
  features: FaceFeatures,
  timestamp: number
): VisionEvent {
  return {
    type,
    confidence: roundScore(confidence),
    quality_score: roundScore(features.quality_score),
    timestamp
  };
}

export class ActionDetector {
  private readonly thresholds: ActionThresholds;
  private stableStart: number | null = null;
  private eyesClosedStart: number | null = null;

  constructor(thresholds: ActionThresholds = DEFAULT_ACTION_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  reset(): void {
    this.stableStart = null;
    this.eyesClosedStart = null;
  }

  update(features: FaceFeatures, timestamp: number): VisionEvent | null {
    if (evaluateVisionQuality(features, this.thresholds) !== "ready") {
      this.reset();
      return null;
    }

    const blinkScore =
      (blendshapeScore(features, "eyeBlinkLeft") + blendshapeScore(features, "eyeBlinkRight")) / 2;
    const smileScore =
      (blendshapeScore(features, "mouthSmileLeft") + blendshapeScore(features, "mouthSmileRight")) / 2;
    const browScore =
      (blendshapeScore(features, "browOuterUpLeft") + blendshapeScore(features, "browOuterUpRight")) / 2;
    const mouthScore = blendshapeScore(features, "jawOpen");
    const headTurnScore = Math.min(1, Math.abs(features.yaw) / 45);

    if (blinkScore >= this.thresholds.eyes_closed_score) {
      this.stableStart = null;
      this.eyesClosedStart ??= timestamp;

      if (timestamp - this.eyesClosedStart >= this.thresholds.eyes_closed_duration_ms) {
        return makeEvent("eyes_closed", blinkScore, features, timestamp);
      }

      return makeEvent("blink", blinkScore, features, timestamp);
    }

    this.eyesClosedStart = null;

    if (blinkScore >= this.thresholds.blink_score) {
      this.stableStart = null;
      return makeEvent("blink", blinkScore, features, timestamp);
    }

    if (smileScore >= this.thresholds.smile_score) {
      this.stableStart = null;
      return makeEvent("smile", smileScore, features, timestamp);
    }

    if (browScore >= this.thresholds.brow_up_score) {
      this.stableStart = null;
      return makeEvent("brow_up", browScore, features, timestamp);
    }

    if (mouthScore >= this.thresholds.mouth_open_score) {
      this.stableStart = null;
      return makeEvent("mouth_open", mouthScore, features, timestamp);
    }

    if (Math.abs(features.yaw) >= this.thresholds.head_turn_yaw_degrees) {
      this.stableStart = null;
      return makeEvent("head_turn", headTurnScore, features, timestamp);
    }

    this.stableStart ??= timestamp;

    if (timestamp - this.stableStart >= this.thresholds.look_stable_duration_ms) {
      return makeEvent("look_stable", 0.78, features, timestamp);
    }

    return null;
  }
}
