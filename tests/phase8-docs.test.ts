import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 8 admin artifacts", () => {
  it("exposes a phase 8 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase8"]).toBe("vitest run tests/phase8-admin.test.ts tests/phase8-docs.test.ts");
  });

  it("documents the admin config center", () => {
    const doc = readDoc("docs/phase8/admin-config-center.md");

    expect(doc).toContain("# 第8阶段运营后台与配置中心 v0.1");
    expect(doc).toContain("AdminConfigStore");
    expect(doc).toContain("CardBlocklist");
    expect(doc).toContain("ReleaseGate");
    expect(doc).toContain("不接真实生产数据库");
    expect(doc).toContain("原始图片");
  });

  it("documents the phase 9 SaaS versus hardware decision", () => {
    const doc = readDoc("docs/phase8/phase9-decision.md");

    expect(doc).toContain("Phase 9");
    expect(doc).toContain("SaaS 后台");
    expect(doc).toContain("线下硬件化");
    expect(doc).toContain("Go/No-Go");
    expect(doc).toContain("不接任何硬件 SDK");
  });
});
