import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 6 launch artifacts", () => {
  it("exposes a phase 6 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase6"]).toBe("vitest run tests/phase6-launch.test.ts tests/phase6-docs.test.ts");
  });

  it("documents the launch report and public metrics", () => {
    const report = readDoc("docs/phase6/launch-report.md");

    expect(report).toContain("# 第6阶段发布复盘报告");
    expect(report).toContain("前程镜");
    expect(report).toContain("Go/No-Go");
    expect(report).toContain("海报生成率");
    expect(report).toContain("不含原始人脸");
  });

  it("documents operations SOP, blocklist, rollback, and legal review gates", () => {
    const sop = readDoc("docs/phase6/operations-sop.md");

    expect(sop).toContain("# 第6阶段运营 SOP");
    expect(sop).toContain("卡牌下线");
    expect(sop).toContain("回滚");
    expect(sop).toContain("法务复核");
    expect(sop).toContain("不上传原始图片、视频或人脸模板");
  });

  it("documents the second-scenario reuse package", () => {
    const reuse = readDoc("docs/phase6/second-scenario-reuse.md");

    expect(reuse).toContain("# 第二场景复用说明");
    expect(reuse).toContain("山河镜");
    expect(reuse).toContain("ThemePack");
    expect(reuse).toContain("CampaignConfig");
  });
});
