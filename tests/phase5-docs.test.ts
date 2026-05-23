import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 5 gray-test artifacts", () => {
  it("exposes a phase 5 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase5"]).toBe("vitest run tests/phase5-gray.test.ts tests/phase5-docs.test.ts");
  });

  it("documents the gray test report and observed metrics", () => {
    const report = readDoc("docs/phase5/gray-test-report.md");

    expect(report).toContain("# 第5阶段灰度测试反馈报告");
    expect(report).toContain("完成率");
    expect(report).toContain("分享意愿");
    expect(report).toContain("负面反馈率");
    expect(report).toContain("不上传原始图片、视频或人脸模板");
  });

  it("documents the Phase 6 release decision handoff", () => {
    const decision = readDoc("docs/phase5/phase6-release-decision.md");

    expect(decision).toContain("# Phase 6 发布决策建议");
    expect(decision).toContain("Go/No-Go");
    expect(decision).toContain("法务复核");
    expect(decision).toContain("卡牌下线");
  });
});
