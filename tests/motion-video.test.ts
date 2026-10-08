import { expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chord, synth, wav } from "../skills/motion-video/scripts/beat-music";
import { closeness, draw, loadCatalog, loadHistory } from "../skills/motion-video/scripts/draw";

const catalog = loadCatalog();

test("棚の表を読める（構成 19 種・見た目 10 種）", () => {
  expect(catalog.concepts).toHaveLength(19);
  expect(catalog.directions).toHaveLength(10);
  expect(catalog.concepts.map((c) => c.no)).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
  for (const d of catalog.directions) {
    expect(["明るい", "暗い", "-"]).toContain(d.brightness);
    expect(["速い", "ゆったり", "-"]).toContain(d.speed);
    expect(["真面目", "遊び", "-"]).toContain(d.tone);
  }
});

test("同じ種なら同じ案、違う種なら違う案が出る", () => {
  const a = draw(catalog, { seed: 42 });
  expect(draw(catalog, { seed: 42 })).toEqual(a);
  const others = [1, 2, 3, 4, 5].map((seed) => JSON.stringify(draw(catalog, { seed })));
  expect(new Set(others).size).toBeGreaterThan(1);
});

test("近い案 2 つと大外し 1 つ。大外しは雰囲気に一番遠い見た目", () => {
  const mood = { brightness: "明るい", speed: "速い", tone: "遊び" };
  const picks = draw(catalog, { seed: 3, mood });
  expect(picks.map((p) => p.role)).toEqual(["近い", "近い", "大外し"]);
  const min = Math.min(...catalog.directions.map((d) => closeness(d, mood)));
  expect(closeness(picks[2].direction, mood)).toBe(min);
  expect(closeness(picks[0].direction, mood)).toBeGreaterThan(min);
  expect(new Set(picks.map((p) => p.concept.no)).size).toBe(3);
});

test("素材が無い構成は引かず、直近の履歴の構成と見た目を避ける", () => {
  for (let seed = 0; seed < 30; seed++) {
    for (const p of draw(catalog, { seed })) expect(p.concept.needs).toBe("なし");
  }
  const history = [{ concept: 2, direction: "ポスターの色面" }, { concept: 8, direction: "明るい誌面" }];
  for (let seed = 0; seed < 30; seed++) {
    for (const p of draw(catalog, { seed, history })) {
      expect([2, 8]).not.toContain(p.concept.no);
      expect(["ポスターの色面", "明るい誌面"]).not.toContain(p.direction.name);
    }
  }
  expect(draw(catalog, { seed: 1, have: ["UI"] }).every((p) => ["なし", "UI"].includes(p.concept.needs))).toBe(true);
});

test("履歴の壊れた行は飛ばす", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "motion-video-"));
  try {
    const file = path.join(dir, "history.jsonl");
    writeFileSync(file, '{"concept": 3, "direction": "紙と印刷"}\nこわれた行\n\n{"concept": 5}\n');
    expect(loadHistory(file)).toEqual([{ concept: 3, direction: "紙と印刷" }, { concept: 5 }]);
    expect(loadHistory(path.join(dir, "none.jsonl"))).toEqual([]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("和音名からベースと 3 和音の周波数を出す", () => {
  expect(chord("Am").bass).toBeCloseTo(55, 1);
  expect(chord("Am").tones.map((f) => Math.round(f))).toEqual([220, 262, 330]);
  expect(chord("F").bass).toBeCloseTo(43.65, 1);
  expect(chord("C").bass).toBeCloseTo(65.41, 1);
  expect(() => chord("H")).toThrow();
});

test("拍の表から決まった長さの WAV を作り、同じ表なら同じ音になる", () => {
  const table = { bpm: 120, beats: 8, groove: [0, 8] as [number, number], drops: [0], whooshes: [4], typing: [{ start: 1, count: 3, every: 0.25 }], fadeFrom: 7 };
  const a = synth(table);
  expect(a.left.length).toBe(48000 * 4);
  const peak = Math.max(...a.left.map(Math.abs), ...a.right.map(Math.abs));
  expect(peak).toBeCloseTo(0.89, 2);
  expect(synth(table).left).toEqual(a.left);
  const bytes = wav(a.left, a.right);
  expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe("RIFF");
  expect(bytes.length).toBe(44 + a.left.length * 4);
});

test("beat-music は引数の数が違えば使い方を出して 2 で終わる", () => {
  const result = Bun.spawnSync(["bun", path.join(import.meta.dir, "../skills/motion-video/scripts/beat-music.ts"), "only-one"], { stdout: "pipe", stderr: "pipe" });
  expect(result.exitCode).toBe(2);
  expect(new TextDecoder().decode(result.stderr)).toContain("usage:");
  expect(readFileSync(path.join(import.meta.dir, "../skills/motion-video/scripts/draw.ts"), "utf8")).toContain("usage:");
});
