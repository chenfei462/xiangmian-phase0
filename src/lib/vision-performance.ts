export type PerformanceSnapshot = {
  average_frame_time_ms: number;
  max_frame_time_ms: number;
  fps: number;
  sample_count: number;
};

export class PerformanceSampler {
  private readonly maxSamples: number;
  private samples: number[] = [];

  constructor(maxSamples = 90) {
    this.maxSamples = maxSamples;
  }

  recordFrame(frameTimeMs: number): void {
    this.samples = [...this.samples, frameTimeMs].slice(-this.maxSamples);
  }

  getSnapshot(): PerformanceSnapshot {
    if (this.samples.length === 0) {
      return {
        average_frame_time_ms: 0,
        max_frame_time_ms: 0,
        fps: 0,
        sample_count: 0
      };
    }

    const total = this.samples.reduce((sum, value) => sum + value, 0);
    const average = total / this.samples.length;

    return {
      average_frame_time_ms: Number(average.toFixed(2)),
      max_frame_time_ms: Number(Math.max(...this.samples).toFixed(2)),
      fps: Number((1000 / average).toFixed(2)),
      sample_count: this.samples.length
    };
  }
}
