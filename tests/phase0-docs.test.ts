import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 0 planning artifacts", () => {
  it("documents PRD v0.5 with P0 scope and acceptance criteria", () => {
    const prd = readDoc("docs/phase0/prd-v0.5.md");

    expect(prd).toContain("# 观相镜 PRD v0.5");
    expect(prd).toContain("90 秒");
    expect(prd).toContain("手动抽卡模式");
    expect(prd).toContain("MVP P0");
  });

  it("documents source inventory with collation and risk metadata", () => {
    const inventory = readDoc("docs/phase0/source-inventory-v0.1.md");

    expect(inventory).toContain("# 资料清单 v0.1");
    expect(inventory).toContain("校勘状态");
    expect(inventory).toContain("风险等级");
    expect(inventory.match(/SRC-\d{3}/g)?.length ?? 0).toBeGreaterThanOrEqual(10);
  });

  it("documents compliance redlines and the camera authorization copy", () => {
    const redlines = readDoc("docs/phase0/compliance-redlines-v0.1.md");

    expect(redlines).toContain("# 合规红线 v0.1");
    expect(redlines).toContain("不上传、不保存你的原始图像或视频");
    expect(redlines).toContain("不进行身份识别");
    expect(redlines).toContain("未成年人");
  });

  it("documents the Web/H5 technical research result", () => {
    const brief = readDoc("docs/phase0/web-h5-technical-brief.md");

    expect(brief).toContain("# Web/H5 技术预研简报");
    expect(brief).toContain("MediaPipe Face Landmarker");
    expect(brief).toContain("拒绝摄像头");
    expect(brief).toContain("Go/No-Go");
  });
});
