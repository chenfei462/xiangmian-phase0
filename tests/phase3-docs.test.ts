import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 3 MVP artifacts", () => {
  it("exposes an MVP validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:mvp"]).toBe("vitest run tests/mvp-phase3.test.ts");
  });

  it("documents the H5 MVP scope and acceptance criteria", () => {
    const plan = readDoc("docs/phase3/h5-mvp-v0.1.md");

    expect(plan).toContain("# Web/H5 MVP v0.1");
    expect(plan).toContain("开镜授权");
    expect(plan).toContain("手动抽卡");
    expect(plan).toContain("90 秒");
    expect(plan).toContain("不上传、不保存");
  });

  it("documents the Phase 4 handoff and deferred scope", () => {
    const handoff = readDoc("docs/phase3/phase4-handoff.md");

    expect(handoff).toContain("# Phase 4 交接说明");
    expect(handoff).toContain("分享海报");
    expect(handoff).toContain("后台管理");
    expect(handoff).toContain("Next.js");
  });
});
