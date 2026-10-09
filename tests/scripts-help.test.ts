import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// 同梱スクリプトは単体で使い方が分かるようにする（rules/skill-layering.md「書き方」）。
// skills/*/scripts/ と skills/*/assets/ の shebang 付きファイル、templates/hooks/ を自動で拾うので、
// スクリプトを足したときに --help を付け忘れるとここで落ちる。
const repo = path.resolve(import.meta.dir, "..");

function bundledScripts(): string[] {
  const dirs = [path.join(repo, "templates/hooks")];
  for (const skill of readdirSync(path.join(repo, "skills"))) {
    for (const sub of ["scripts", "assets"]) dirs.push(path.join(repo, "skills", skill, sub));
  }
  const files: string[] = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const file = path.join(dir, name);
      if (!statSync(file).isFile()) continue; // assets/ の下のフォルダ（雛形など）は道具ではない
      if (readFileSync(file, "utf8").startsWith("#!")) files.push(file);
    }
  }
  return files.sort();
}

function interpreter(file: string): string {
  const shebang = readFileSync(file, "utf8").split("\n", 1)[0];
  for (const name of ["zsh", "bash", "bun", "python3"]) if (shebang.includes(name)) return name;
  throw new Error(`shebang から実行系が分からない: ${shebang}`);
}

const sandboxes: string[] = [];
afterEach(() => { for (const dir of sandboxes.splice(0)) rmSync(dir, { recursive: true, force: true }); });

test("同梱スクリプトを見つけられている", () => {
  expect(bundledScripts().length).toBeGreaterThanOrEqual(7);
});

for (const file of bundledScripts()) {
  const name = path.relative(repo, file);
  test(`${name} は --help で使い方を標準出力に出し、何も書き込まずに終了 0`, () => {
    // 空のディレクトリと空の HOME で動かし、--help が棚卸しや生成を始めないことも確かめる
    const cwd = realpathSync(mkdtempSync(path.join(os.tmpdir(), "scripts-help-")));
    sandboxes.push(cwd);
    const result = Bun.spawnSync([interpreter(file), file, "--help"], { cwd, env: { ...process.env, HOME: cwd }, stdout: "pipe", stderr: "pipe" });
    const stdout = new TextDecoder().decode(result.stdout);
    expect(result.exitCode).toBe(0);
    expect(stdout).toMatch(/usage:|使い方:/i);
    expect(readdirSync(cwd)).toEqual([]);
  });
}
