import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 2 planning artifacts", () => {
  it("documents the visual prototype scope and acceptance criteria", () => {
    const plan = readDoc("docs/phase2/vision-prototype-v0.1.md");

    expect(plan).toContain("# 视觉原型 v0.1");
    expect(plan).toContain("FaceFeatures");
    expect(plan).toContain("不上传、不保存");
    expect(plan).toContain("Phase 3");
  });

  it("documents action thresholds and fallback messages", () => {
    const thresholds = readDoc("docs/phase2/action-thresholds.md");

    expect(thresholds).toContain("# 动作阈值表");
    expect(thresholds).toContain("eyes_closed");
    expect(thresholds).toContain("镜面还未定");
    expect(thresholds).toContain("手动抽卡");
  });

  it("documents compatibility and QA results for target browsers", () => {
    const compatibility = readDoc("docs/phase2/compatibility-matrix.md");

    expect(compatibility).toContain("# 兼容性矩阵");
    expect(compatibility).toContain("Desktop Chrome");
    expect(compatibility).toContain("Android Chrome");
    expect(compatibility).toContain("iOS Safari");
  });
});
