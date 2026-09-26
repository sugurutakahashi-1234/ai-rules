#!/usr/bin/env bun
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";

type CommandResult = { code: number; out: string };
export type Runner = (cwd: string, args: string[]) => CommandResult;
export const run: Runner = (cwd, args) => {
  const result = Bun.spawnSync(args, { cwd, stdout: "pipe", stderr: "pipe" });
  return { code: result.exitCode, out: new TextDecoder().decode(result.stdout) + new TextDecoder().decode(result.stderr) };
};

function git(cwd: string, ...args: string[]): string {
  const result = run(cwd, ["git", "--no-optional-locks", ...args]);
  if (result.code !== 0) throw new Error(result.out.trim() || `git ${args[0]} failed`);
  return result.out.trim();
}

function readJson(file: string): any {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function inspect(project: string) {
  const dir = realpathSync(project);
  const repo = realpathSync(git(dir, "rev-parse", "--show-toplevel"));
  const commonGit = realpathSync(path.resolve(dir, git(dir, "rev-parse", "--git-common-dir")));
  const config = Bun.JSONC.parse(readFileSync(path.join(dir, "rulesync.jsonc"), "utf8")) as any;
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("rulesync.jsonc must be an object");
  if (config.sources !== undefined && !Array.isArray(config.sources)) throw new Error("sources must be an array");
  const sources = (config.sources ?? []).map((entry: any) => {
    if (!entry || typeof entry.source !== "string") throw new Error("Each source must have a source string");
    return { source: entry.source, ref: entry.ref ?? null, transport: entry.transport ?? "github" };
  });
  const pkg = existsSync(path.join(dir, "package.json")) ? readJson(path.join(dir, "package.json")) : {};
  const locks: Record<string, unknown> = {};
  for (const file of ["rulesync.lock", "rulesync-npm.lock.json"]) {
    if (existsSync(path.join(dir, file))) {
      const entries = readJson(path.join(dir, file)).sources ?? {};
      locks[file] = Object.fromEntries(Object.entries(entries).map(([key, value]: [string, any]) => [key, {
        requestedRef: value.requestedRef ?? null, resolvedRef: value.resolvedRef ?? null,
      }]));
    }
  }
  const origin = run(dir, ["git", "remote", "get-url", "origin"]);
  return {
    project: dir, repo, commonGit, remote: origin.code === 0 ? origin.out.trim() : null,
    dirty: git(repo, "status", "--porcelain", "--untracked-files=all") !== "",
    sources, locks,
    // 完全固定 + catalog 化したリポは `"catalog:"` で参照するので、ルートの workspaces.catalog から実際の版を引く
    rulesync: ((spec: string | null) => spec === "catalog:" ? pkg.workspaces?.catalog?.rulesync ?? null : spec)(
      pkg.devDependencies?.rulesync ?? pkg.dependencies?.rulesync ?? null),
    scripts: { rulesync: pkg.scripts?.rulesync ?? null, check: pkg.scripts?.["rulesync:check"] ?? null },
    config, pkg,
  };
}

type Project = ReturnType<typeof inspect>;
function summary(info: Project) {
  const { config, pkg, ...publicInfo } = info;
  return publicInfo;
}

const ignoredDirs = new Set(["node_modules", "vendor", "dist", "build", "target", "coverage"]);
export function discover(roots: string[]) {
  const found = new Set<string>();
  const visited = new Set<string>();
  const errors: { project: string; error: string }[] = [];
  function walk(dir: string) {
    try {
      dir = realpathSync(dir);
      if (visited.has(dir)) return;
      visited.add(dir);
      if (existsSync(path.join(dir, "rulesync.jsonc"))) found.add(dir);
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && !ignoredDirs.has(entry.name)) walk(path.join(dir, entry.name));
      }
    } catch (error) { errors.push({ project: dir, error: String(error) }); }
  }
  for (const root of roots) walk(root);
  const projects: ReturnType<typeof summary>[] = [];
  for (const dir of [...found].sort()) {
    try { projects.push(summary(inspect(dir))); }
    catch (error) { errors.push({ project: dir, error: String(error) }); }
  }
  return { projects, errors };
}

export type Options = { projects: string[]; sources: boolean; version?: string; apply: boolean };
type Step = { args: string[]; label: string };
type Report = {
  project: string;
  status: "planned" | "updated" | "unchanged" | "blocked" | "failed";
  reason?: string;
  plan?: Step[];
  completed?: string[];
  changes?: string;
  timestampOnly?: boolean;
  inventory?: ReturnType<typeof summary>;
};

function preflight(info: Project, options: Options): void {
  if (info.dirty) throw new Error("作業中の差分があります。差分を保持して個別対応してください");
  if (info.project !== info.repo || info.pkg.workspaces) throw new Error("モノレポ・Git ルート以外の設定は既存の実行経路で個別対応してください");
  if (existsSync(path.join(info.project, "rulesync.local.jsonc"))) throw new Error("rulesync.local.jsonc による上書きがあります。個別対応してください");
  if ((info.config.outputRoots ?? ["."]).some((root: string) => path.resolve(info.project, root) !== info.project)) {
    throw new Error("outputRoots がプロジェクト外または別ディレクトリを指定しています。個別対応してください");
  }
  if (info.config.global === true) throw new Error("global 設定は一括更新の対象外です");
  if (typeof info.rulesync !== "string" || !/^[~^]?\d+\.\d+\.\d+$/.test(info.rulesync)) {
    throw new Error("rulesync の直接依存が単純な安定版指定ではありません。個別対応してください");
  }
  if (!info.scripts.rulesync || !info.scripts.check) throw new Error("package.json に rulesync / rulesync:check scripts が必要です");
  if (!existsSync(path.join(info.project, "bun.lock")) && !existsSync(path.join(info.project, "bun.lockb"))) {
    throw new Error("Bun lockfile がありません。既存のパッケージマネージャーで個別対応してください");
  }
  if (["package-lock.json", "pnpm-lock.yaml", "yarn.lock"].some(file => existsSync(path.join(info.project, file))) ||
      (info.pkg.packageManager && !info.pkg.packageManager.startsWith("bun@"))) {
    throw new Error("別パッケージマネージャーの設定があります。個別対応してください");
  }
  if (options.sources && info.sources.length === 0) throw new Error("更新する sources がありません。本体更新だけなら --sources を外してください");
}

function makePlan(info: Project, options: Options): Step[] {
  const binary = path.join(info.project, "node_modules", ".bin", "rulesync");
  const steps: Step[] = [{ label: "install-dependencies", args: ["bun", "install", "--frozen-lockfile", "--ignore-scripts"] }];
  if (options.version) steps.push({ label: "update-rulesync", args: ["bun", "update", `rulesync@${options.version}`, "--ignore-scripts"] });
  steps.push({ label: "doctor-before", args: [binary, "doctor", "--strict"] });
  if (options.sources) steps.push({ label: "update-sources", args: [binary, "install", "--update"] });
  steps.push(
    { label: "generate", args: ["bun", "run", "rulesync"] },
    { label: "project-check", args: ["bun", "run", "rulesync:check"] },
    { label: "doctor-after", args: [binary, "doctor", "--strict"] },
    { label: "generated-check", args: [binary, "generate", "--check"] },
    { label: "diff-check", args: ["git", "diff", "--check"] },
  );
  return steps;
}

function withoutTimestamp(value: any): any {
  if (Array.isArray(value)) return value.map(withoutTimestamp);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== "resolvedAt").sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, withoutTimestamp(item)]));
  return value;
}

function changes(info: Project, before: Map<string, string>) {
  const status = git(info.repo, "status", "--porcelain", "--untracked-files=all");
  const files = git(info.repo, "diff", "--name-only", "-z").split("\0").filter(Boolean);
  const staged = git(info.repo, "diff", "--cached", "--name-only");
  const untracked = git(info.repo, "ls-files", "--others", "--exclude-standard");
  const timestampOnly = files.length > 0 && !staged && !untracked && files.every(file => {
    if (!before.has(file)) return false;
    try {
      return JSON.stringify(withoutTimestamp(JSON.parse(before.get(file)!))) ===
        JSON.stringify(withoutTimestamp(readJson(path.join(info.repo, file))));
    } catch { return false; }
  });
  return { changes: status, timestampOnly: Boolean(timestampOnly) };
}

export function update(options: Options, execute: Runner = run): Report[] {
  if (!options.projects.length || (!options.sources && !options.version)) throw new Error("--project と、--sources または --rulesync-version が必要です");
  if (options.version && !/^\d+\.\d+\.\d+$/.test(options.version)) throw new Error("--rulesync-version は X.Y.Z 形式の安定版を指定してください");
  const reports: Report[] = [];
  const entries = new Map<string, Project>();
  for (const project of options.projects) {
    try { const info = inspect(project); entries.set(info.project, info); }
    catch (error) { reports.push({ project, status: "blocked", reason: String(error) }); }
  }
  for (const initial of entries.values()) {
    let info = initial;
    const before = new Map<string, string>();
    const report: Report = { project: info.project, status: "blocked", completed: [], inventory: summary(info) };
    reports.push(report);
    try {
      if ([...entries.values()].filter(entry => entry.commonGit === info.commonGit).length > 1) {
        throw new Error("同じ Git リポジトリの複数 worktree が選択されています。一つに絞ってください");
      }
      info = inspect(info.project);
      preflight(info, options);
      report.plan = makePlan(info, options);
      report.status = "planned";
      if (!options.apply) continue;
      for (const file of ["rulesync.lock", "rulesync-npm.lock.json"]) {
        if (existsSync(path.join(info.repo, file))) before.set(file, readFileSync(path.join(info.repo, file), "utf8"));
      }
      report.status = "failed";
      for (const step of report.plan) {
        process.stderr.write(`${info.project}: ${step.label}\n`);
        const result = execute(info.project, step.args);
        if (result.code !== 0) throw new Error(`${step.label} (exit ${result.code})\n${result.out.trim()}`);
        report.completed!.push(step.label);
        if (step.label === "install-dependencies" || step.label === "update-rulesync") {
          const binary = path.join(info.project, "node_modules", ".bin", "rulesync");
          if (!existsSync(binary)) throw new Error("ローカルの rulesync 実行ファイルがありません");
          if (step.label === "update-rulesync") {
            const actual = execute(info.project, [binary, "--version"]);
            if (actual.code !== 0 || actual.out.trim() !== options.version) throw new Error(`rulesync が指定版 ${options.version} と一致しません`);
          }
        }
      }
      Object.assign(report, changes(info, before));
      report.status = report.changes ? "updated" : "unchanged";
    } catch (error) {
      report.reason = String(error);
      if (report.status === "failed") {
        try { Object.assign(report, changes(info, before)); } catch { /* Preserve the original failure. */ }
      }
    }
  }
  return reports;
}

export function main(args: string[]): number {
  const help = `Usage:
  bun update.ts list --root PATH [--root PATH ...]
  bun update.ts update --project PATH [--project PATH ...] [--sources] [--rulesync-version X.Y.Z] [--apply]

list はローカル棚卸し。update は --apply なしでは計画のみ。
--sources は対象プロジェクトの全 sources を更新。Git add/commit/push は実行しません。
結果は stdout の JSON、進捗は stderr。blocked/failed または探索エラーは終了コード 1。`;
  if (!args.length || args.includes("--help")) { console.log(help); return 0; }
  const [command, ...rest] = args;
  const roots: string[] = [];
  const options: Options = { projects: [], sources: false, apply: false };
  if (command !== "list" && command !== "update") throw new Error(`Unknown command: ${command}`);
  for (let index = 0; index < rest.length; index++) {
    const flag = rest[index];
    if (command === "update" && flag === "--sources") options.sources = true;
    else if (command === "update" && flag === "--apply") options.apply = true;
    else if ((command === "list" && flag === "--root") || (command === "update" && ["--project", "--rulesync-version"].includes(flag))) {
      const value = rest[++index];
      if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
      if (flag === "--root") roots.push(value);
      else if (flag === "--project") options.projects.push(value);
      else options.version = value;
    } else throw new Error(`Unknown option: ${flag}`);
  }
  if (command === "list") {
    if (!roots.length) throw new Error("--root を明示してください");
    const result = discover(roots);
    console.log(JSON.stringify(result, null, 2));
    return result.errors.length ? 1 : 0;
  }
  const results = update(options);
  console.log(JSON.stringify({ mode: options.apply ? "apply" : "plan", results }, null, 2));
  return results.some(result => result.status === "blocked" || result.status === "failed") ? 1 : 0;
}

if (import.meta.main) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) { console.error(String(error)); process.exitCode = 1; }
}
