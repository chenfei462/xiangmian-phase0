import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 1 planning artifacts", () => {
  it("exposes a knowledge-base validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:knowledge"]).toBe("vitest run tests/knowledge-base.test.ts");
  });

  it("documents the knowledge-base implementation plan and acceptance criteria", () => {
    const plan = readDoc("docs/phase1/knowledge-base-v0.1.md");

    expect(plan).toContain("# 古籍知识库 v0.1");
    expect(plan).toContain("300-500");
    expect(plan).toContain("A/B/C/D");
    expect(plan).toContain("Phase 2/3 交接");
  });

  it("documents the content production workflow and review states", () => {
    const workflow = readDoc("docs/phase1/content-production-workflow.md");

    expect(workflow).toContain("# 内容生产流水线");
    expect(workflow).toContain("古籍摘录");
    expect(workflow).toContain("安全改写");
    expect(workflow).toContain("approved");
  });

  it("documents the QA report with counts and safety gates", () => {
    const qa = readDoc("docs/phase1/content-qa-report.md");

    expect(qa).toContain("# 第1阶段内容 QA 报告");
    expect(qa).toContain("360");
    expect(qa).toContain("C/D 条目不得出现在可发布卡牌候选集中");
    expect(qa).toContain("npm test");
  });
});
