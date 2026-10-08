import { afterEach, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { discover, inspect, main, run, update, usage, type Runner } from "../skills/ai-rules-update/scripts/update";

const roots: string[] = [];
function sandbox() {
  const root = realpathSync(mkdtempSync(path.join(os.tmpdir(), "ai-rules-update-test-")));
  roots.push(root);
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

function fixture(root: string, name = "consumer with spaces") {
  const dir = path.join(root, name);
  mkdirSync(dir, { recursive: true });
  expect(run(dir, ["git", "init", "--quiet"]).code).toBe(0);
  // Fixtures start clean without staging or committing anything.
  writeFileSync(path.join(dir, ".git/info/exclude"), "/package.json\n/bun.lock\n/rulesync.jsonc\n/rulesync.lock\n/node_modules/\n");
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({
    private: true,
    devDependencies: { rulesync: "^19.0.0" },
    scripts: { rulesync: "./node_modules/.bin/rulesync generate", "rulesync:check": "./node_modules/.bin/rulesync generate --check" },
  }));
  writeFileSync(path.join(dir, "bun.lock"), "{}");
  writeFileSync(path.join(dir, "rulesync.jsonc"), `{
    // A URL must survive comment parsing.
    "$schema": "https://example.com/schema.json",
    "sources": [{ "source": "example/ai-rules", }, { "source": "example/other@v1.0.0", }],
    "outputRoots": ["."],
  }`);
  writeFileSync(path.join(dir, "rulesync.lock"), JSON.stringify({ sources: { "example/ai-rules": { resolvedRef: "old-sha", requestedRef: null } } }));
  mkdirSync(path.join(dir, "node_modules/.bin"), { recursive: true });
  const binary = path.join(dir, "node_modules/.bin/rulesync");
  writeFileSync(binary, `#!/usr/bin/env bun
import { writeFileSync, readFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args.includes('--version')) console.log('19.0.0');
else if (args[0] === 'install') writeFileSync('rulesync.lock', JSON.stringify({ sources: { 'example/ai-rules': { resolvedRef: 'new-sha' } } }));
else if (args[0] === 'generate' && !args.includes('--check')) writeFileSync('generated.md', 'updated rules');
else if (args.includes('--check') && readFileSync('generated.md', 'utf8') !== 'updated rules') process.exit(1);
`);
  chmodSync(binary, 0o755);
  return dir;
}

function localRunner(calls: string[][]): Runner {
  return (cwd, args) => {
    calls.push(args);
    // Do not download dependencies; run generation/check commands in the fixture.
    if (args[0] === "bun" && ["install", "update"].includes(args[1])) return { code: 0, out: "" };
    return run(cwd, args);
  };
}

test("JSONC inventory includes locked refs and all sources without modifying the repo", () => {
  const dir = fixture(sandbox());
  const inventory = inspect(dir);
  expect(inventory.dirty).toBe(false);
  expect(inventory.sources.map((item: any) => item.source)).toEqual(["example/ai-rules", "example/other@v1.0.0"]);
  expect(inventory.locks).toEqual({ "rulesync.lock": { "example/ai-rules": { requestedRef: null, resolvedRef: "old-sha" } } });
  expect(run(dir, ["git", "status", "--porcelain"]).out).toBe("");
});

test("discovery deduplicates roots, excludes generated/dependency trees and directory symlinks", () => {
  const root = sandbox();
  const dir = fixture(root);
  for (const relative of ["node_modules/hidden", ".agents/skills/copy", "dist/copy"]) {
    mkdirSync(path.join(dir, relative), { recursive: true });
    writeFileSync(path.join(dir, relative, "rulesync.jsonc"), "{}");
  }
  symlinkSync(root, path.join(root, "cycle"));
  const result = discover([root, dir]);
  expect(result.projects).toHaveLength(1);
  expect(result.errors).toEqual([]);
});

test("discovery reports malformed configuration and missing roots rather than claiming success", () => {
  const root = sandbox();
  const dir = fixture(root);
  writeFileSync(path.join(dir, "rulesync.jsonc"), "invalid");
  const result = discover([root, path.join(root, "missing")]);
  expect(result.projects).toEqual([]);
  expect(result.errors).toHaveLength(2);
});

test("plan performs no dependency installation, generation, or source writes", () => {
  const dir = fixture(sandbox());
  const before = readFileSync(path.join(dir, "rulesync.lock"), "utf8");
  const report = update({ projects: [dir, dir], sources: true, version: "19.0.0", apply: false }, () => { throw new Error("must not execute"); });
  expect(report).toHaveLength(1);
  expect(report[0].status).toBe("planned");
  expect(report[0].plan!.map(step => step.label).indexOf("update-rulesync")).toBeLessThan(report[0].plan!.map(step => step.label).indexOf("update-sources"));
  expect(existsSync(path.join(dir, "generated.md"))).toBe(false);
  expect(readFileSync(path.join(dir, "rulesync.lock"), "utf8")).toBe(before);
});

test("dirty consumer is left intact while an independent clean consumer completes", () => {
  const root = sandbox();
  const dirty = fixture(root, "dirty");
  const clean = fixture(root, "clean");
  writeFileSync(path.join(dirty, "user-work.txt"), "preserve me");
  const calls: string[][] = [];
  const result = update({ projects: [dirty, clean], sources: true, apply: true }, localRunner(calls));
  expect(result.map(item => item.status)).toEqual(["blocked", "updated"]);
  expect(readFileSync(path.join(dirty, "user-work.txt"), "utf8")).toBe("preserve me");
  expect(readFileSync(path.join(dirty, "rulesync.lock"), "utf8")).toContain("old-sha");
  expect(readFileSync(path.join(clean, "generated.md"), "utf8")).toBe("updated rules");
  expect(run(clean, ["git", "diff", "--cached", "--name-only"]).out).toBe("");
  expect(calls.some(args => args[0] === "git" && ["add", "commit", "push", "reset", "checkout", "stash"].includes(args[1]))).toBe(false);
});

test("failed check preserves generated changes, records the failed stage, and continues", () => {
  const root = sandbox();
  const fail = fixture(root, "fail");
  const pass = fixture(root, "pass");
  const calls: string[][] = [];
  const normal = localRunner(calls);
  const result = update({ projects: [fail, pass], sources: true, apply: true }, (cwd, args) => {
    if (cwd === fail && args.join(" ") === "bun run rulesync:check") return { code: 1, out: "fixture check failure" };
    return normal(cwd, args);
  });
  expect(result.map(item => item.status)).toEqual(["failed", "updated"]);
  expect(result[0].reason).toContain("project-check (exit 1)");
  expect(result[0].changes).toContain("generated.md");
  expect(readFileSync(path.join(fail, "generated.md"), "utf8")).toBe("updated rules");
});

test("version-only update does not refresh sources and verifies the installed version", () => {
  const dir = fixture(sandbox());
  const calls: string[][] = [];
  const result = update({ projects: [dir], sources: false, version: "19.0.0", apply: true }, localRunner(calls));
  expect(result[0].status).toBe("updated");
  expect(calls).toContainEqual(["bun", "update", "rulesync@19.0.0", "--ignore-scripts"]);
  expect(calls.some(args => args.includes("--update"))).toBe(false);
  expect(readFileSync(path.join(dir, "rulesync.lock"), "utf8")).toContain("old-sha");
});

test("wrong installed version stops before source refresh or generation", () => {
  const dir = fixture(sandbox());
  const calls: string[][] = [];
  const result = update({ projects: [dir], sources: true, version: "20.0.0", apply: true }, localRunner(calls));
  expect(result[0].status).toBe("failed");
  expect(result[0].reason).toContain("指定版 20.0.0 と一致しません");
  expect(existsSync(path.join(dir, "generated.md"))).toBe(false);
});

test("missing local binary fails without falling back to a downloaded/global rulesync", () => {
  const dir = fixture(sandbox());
  rmSync(path.join(dir, "node_modules"), { recursive: true });
  const calls: string[][] = [];
  const result = update({ projects: [dir], sources: true, apply: true }, localRunner(calls));
  expect(result[0].status).toBe("failed");
  expect(calls).toEqual([["bun", "install", "--frozen-lockfile", "--ignore-scripts"]]);
});

test("unsupported package manager and local config are blocked before mutation", () => {
  const root = sandbox();
  const npm = fixture(root, "npm");
  rmSync(path.join(npm, "bun.lock"));
  const local = fixture(root, "local");
  writeFileSync(path.join(local, ".git/info/exclude"), readFileSync(path.join(local, ".git/info/exclude"), "utf8") + "/rulesync.local.jsonc\n");
  writeFileSync(path.join(local, "rulesync.local.jsonc"), "{}");
  const result = update({ projects: [npm, local], sources: true, apply: true }, () => { throw new Error("must not execute"); });
  expect(result.map(item => item.status)).toEqual(["blocked", "blocked"]);
  expect(result[0].reason).toContain("Bun lockfile");
  expect(result[1].reason).toContain("rulesync.local.jsonc");
});

test("nested configurations sharing a Git repository are blocked together", () => {
  const dir = fixture(sandbox());
  const nested = path.join(dir, "app");
  mkdirSync(nested);
  writeFileSync(path.join(nested, "rulesync.jsonc"), "{}");
  const result = update({ projects: [dir, nested], sources: true, apply: true }, () => { throw new Error("must not execute"); });
  expect(result.map(item => item.status)).toEqual(["blocked", "blocked"]);
  expect(result.every(item => item.reason!.includes("複数 worktree"))).toBe(true);
});

test("explicit roots, project selection, action and stable versions are required", () => {
  expect(() => main(["list"])).toThrow("--root");
  expect(() => main(["list", "--root", "--apply"])).toThrow("requires a value");
  expect(() => main(["update", "--root", "/tmp", "--sources", "--apply"])).toThrow("Unknown option");
  expect(() => update({ projects: [], sources: true, apply: false })).toThrow("--project");
  expect(() => update({ projects: ["/tmp"], sources: false, apply: false })).toThrow("--sources");
  expect(() => update({ projects: ["/tmp"], sources: false, version: "latest", apply: true })).toThrow("安定版");
});

test("CLI returns failure when an explicitly selected project is blocked", () => {
  const dir = fixture(sandbox());
  writeFileSync(path.join(dir, "user-work.txt"), "keep");
  const result = run(dir, [process.execPath, path.resolve(import.meta.dir, "../skills/ai-rules-update/scripts/update.ts"), "update", "--project", dir, "--sources"]);
  expect(result.code).toBe(1);
  expect(JSON.parse(result.out).results[0].status).toBe("blocked");
});

test("usage reverse-indexes selections, honours features, and follows rulesync's rules for omitted selections", () => {
  const root = sandbox();
  const a = fixture(root, "a"), b = fixture(root, "b"), c = fixture(root, "c");
  writeFileSync(path.join(a, "rulesync.jsonc"), `{ "features": ["rules", "skills"], "sources": [{ "source": "example/ai-rules", "rules": ["git-safety"], "skills": ["design-compare"] }] }`);
  // features に skills が無いので、他の source のスキルは数えない。@ 付きの source は同じ上流として束ねる
  writeFileSync(path.join(b, "rulesync.jsonc"), `{ "features": ["rules"], "sources": [{ "source": "example/ai-rules@v1.0.0", "rules": ["git-safety", "japanese-writing"] }, { "source": "other/skills", "skills": ["x"] }] }`);
  // 選定を両方省いた source はスキルを全件取得し、ルールは取得しない
  writeFileSync(path.join(c, "rulesync.jsonc"), `{ "features": ["rules", "skills"], "sources": [{ "source": "example/ai-rules" }] }`);
  const all = usage([root]);
  expect(all.errors).toEqual([]);
  const find = (kind: string, name: string) => all.usage.find(row => row.source === "example/ai-rules" && row.kind === kind && row.name === name)?.projects;
  expect(find("rule", "git-safety")).toEqual([a, b]);
  expect(find("rule", "*")).toBeUndefined();
  expect(find("skill", "design-compare")).toEqual([a]);
  expect(find("skill", "*")).toEqual([c]);
  expect(all.usage.some(row => row.source === "other/skills")).toBe(false);
  const only = usage([root], { skill: "design-compare" });
  expect(only.usage.map(row => [row.name, row.projects])).toEqual([["*", [c]], ["design-compare", [a]]]);
  expect(usage([root], { rule: "japanese-writing" }).usage.map(row => row.projects)).toEqual([[b]]);
  expect(usage([root], { source: "other/skills" }).usage).toEqual([]);
  expect(() => main(["usage"])).toThrow("--root");
  expect(() => main(["usage", "--root", root, "--skill", "x", "--rule", "y"])).toThrow("同時に");
});
