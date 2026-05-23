import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 4 planning and QA artifacts", () => {
  it("exposes a phase 4 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase4"]).toBe("vitest run tests/phase4-safety.test.ts tests/phase4-docs.test.ts");
  });

  it("documents the content audit and safety scan result", () => {
    const report = readDoc("docs/phase4/content-safety-report.md");

    expect(report).toContain("# 第4阶段内容安全复核报告");
    expect(report).toContain("投诉风险文案为 0");
    expect(report).toContain("SafetyScanReport");
    expect(report).toContain("C/D 条目不得进入用户结果");
  });

  it("documents gray-test readiness and Phase 5 handoff metrics", () => {
    const handoff = readDoc("docs/phase4/phase5-gray-test-handoff.md");

    expect(handoff).toContain("# Phase 5 灰度测试交接包");
    expect(handoff).toContain("完成率");
    expect(handoff).toContain("分享率");
    expect(handoff).toContain("匿名事件");
    expect(handoff).toContain("不上传原始图片、视频或人脸模板");
  });
});
