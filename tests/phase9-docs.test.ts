import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function readDoc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("phase 9 SaaS artifacts", () => {
  it("exposes a phase 9 validation command", () => {
    const pkg = JSON.parse(readDoc("package.json")) as { scripts?: Record<string, string> };

    expect(pkg.scripts?.["validate:phase9"]).toBe("vitest run tests/phase9-saas.test.ts tests/phase9-docs.test.ts");
  });

  it("documents the SaaS backend baseline", () => {
    const doc = readDoc("docs/phase9/saas-backend-v0.1.md");

    expect(doc).toContain("# 第9阶段 SaaS 后台基础版 v0.1");
    expect(doc).toContain("TenantWorkspace");
    expect(doc).toContain("PermissionPolicy");
    expect(doc).toContain("PublishedConfigSnapshot");
    expect(doc).toContain("公开 H5 只读取已发布快照");
    expect(doc).toContain("不做公开自助注册");
  });

  it("documents migration and the phase 10 decision", () => {
    const doc = readDoc("docs/phase9/migration-and-phase10-decision.md");

    expect(doc).toContain("Phase 8 的 `AdminConfigStore`");
    expect(doc).toContain("生产 SaaS 试点");
    expect(doc).toContain("线下硬件化");
    expect(doc).toContain("Go/No-Go");
    expect(doc).toContain("打印机、NFC、大屏");
  });
});
