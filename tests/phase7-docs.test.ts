import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 7 second-scenario artifacts", () => {
  it("exposes a phase 7 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase7"]).toBe("vitest run tests/phase7-registry.test.ts tests/phase7-docs.test.ts");
  });

  it("documents the second-scenario launch report", () => {
    const report = readDoc("docs/phase7/second-scenario-report.md");

    expect(report).toContain("# 第7阶段第二场景复盘报告");
    expect(report).toContain("山河镜");
    expect(report).toContain("文旅展陈");
    expect(report).toContain("Go/No-Go");
    expect(report).toContain("不含原始人脸");
  });

  it("documents the venue operations SOP and offline privacy notice", () => {
    const sop = readDoc("docs/phase7/venue-operations-sop.md");

    expect(sop).toContain("# 山河镜场地部署 SOP");
    expect(sop).toContain("线下隐私提示");
    expect(sop).toContain("不上传原始图片、视频或人脸模板");
    expect(sop).toContain("不接打印机、NFC、大屏或硬件 SDK");
  });

  it("documents commercial handoff and phase 8 recommendations", () => {
    const handoff = readDoc("docs/phase7/commercial-handoff.md");

    expect(handoff).toContain("# 第7阶段商业化交付包");
    expect(handoff).toContain("文旅客户演示话术");
    expect(handoff).toContain("品牌联名禁区");
    expect(handoff).toContain("Phase 8");
    expect(handoff).toContain("后台");
  });
});
