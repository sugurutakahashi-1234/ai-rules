import { expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chord, synth, wav } from "../skills/motion-video/scripts/beat-music";
import { closeness, draw, loadCatalog, loadHistory } from "../skills/motion-video/scripts/draw";
import { build } from "../skills/motion-video/scripts/picker";
import { analyze } from "../skills/motion-video/scripts/bgm-candidates";
import { checkScenes } from "../skills/motion-video/scripts/check-scenes";
import { replaceBlock, windowLines } from "../skills/motion-video/scripts/scene-windows";
import { applyPatch, toSeconds } from "../skills/motion-video/scripts/sample";

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

test("選択票: 案を残す数の上限と、1 曲を再生すると他が止まる仕掛けが入る", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    writeFileSync(path.join(dir, "a-s1.png"), "");
    const html = build({
      title: "足切り", mode: "keep", keep: 3,
      columns: [{ key: "B0", name: "案 0", file: "a" }, { key: "B1", name: "案 1", file: "b" }],
      rows: [{ key: "s1", name: "名乗り" }],
      images: "{file}-{row}.png",
      audio: [{ key: "H1", name: "曲 1", src: "h1.mp3" }, { key: "H2", name: "曲 2", src: "h2.mp3" }],
      recommend: { key: "B1", reason: "理由" },
    }, dir);
    expect(html.match(/class="rec">おすすめ</g)).toHaveLength(2); // 案の札と見出しの横の一文
    expect(html).toContain("B1：理由");
    expect(html).toContain('"keep":3');
    expect(html).toContain('src="a-s1.png"');
    expect(html).toContain("まだ無い"); // b-s1.png は無い
    expect(html.match(/<audio /g)).toHaveLength(2);
    expect(html).not.toContain("currentTime = 0"); // 止めた位置は残す（頭に戻さない）
    expect(html).toContain("b.pause()"); // 1 曲を再生すると他は止まる
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("BGM の候補: 中身の終わりと余韻、途中で切れる曲を見分ける", () => {
  const SR = 11025;
  const tone = (sec: number, silentFrom: number) => Float32Array.from({ length: sec * SR }, (_, i) => (i / SR < silentFrom ? 0.5 * Math.sin((2 * Math.PI * 220 * i) / SR) : 0));
  const ends = analyze(tone(30, 26), 30);
  expect(ends.ending).toBe("自然に終わる");
  expect(ends.contentEnd).toBeCloseTo(26, 0);
  expect(ends.tail).toBeCloseTo(4, 0);
  expect(analyze(tone(30, 30), 30).ending).toBe("途中で切れる");
});

test("選択票: 決めごとが複数ならタブで切り替える 1 枚になり、回答をまとめてコピーできる", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    const html = build({
      title: "仕上げ前",
      pages: [
        { title: "技術の見せ方", mode: "keep", keep: 1, columns: [{ key: "T1", name: "案 1" }, { key: "T2", name: "案 2" }], rows: [{ key: "a", name: "歩み" }], images: "{file}-{row}.png", recommend: { key: "T2" } },
        { title: "BGM", audio: [{ key: "M1", name: "曲", src: "m1.mp3" }] },
      ],
    }, dir);
    expect(html.match(/<button class="tab"/g)).toHaveLength(2);
    expect(html).toContain("回答をまとめてコピー");
    expect(html.match(/<section class="page"/g)).toHaveLength(2);
    expect(html).toContain('"mode":"none"'); // BGM だけのページ
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("選択票: mode view のページは残すボタンを出さず、回答済みとして数える", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    const html = build({
      title: "確認",
      pages: [
        { title: "直した点", mode: "view", columns: [{ key: "A1", name: "全景" }], rows: [{ key: "a", name: "全景" }], images: "{file}-{row}.png" },
        { title: "強み", mode: "keep", keep: 1, columns: [{ key: "S1", name: "案" }], rows: [{ key: "a", name: "a" }], images: "{file}-{row}.png" },
      ],
    }, dir);
    expect(html.match(/<button class="keep">/g)).toHaveLength(1);
    expect(html).toContain('"mode":"view"');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("選択票: images が動画なら video で並べる", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    writeFileSync(path.join(dir, "H1-a.mp4"), "");
    const html = build({ title: "動き", mode: "keep", keep: 1, columns: [{ key: "H1", name: "案" }], rows: [{ key: "a", name: "a" }], images: "{file}-{row}.mp4" }, dir);
    expect(html).toContain('<video src="H1-a.mp4" autoplay loop muted playsinline>');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("仮アニメーション: 引数を読み、--help は 0 で終わる", async () => {
  const { parse, main } = await import("../skills/motion-video/scripts/capture-mock");
  const { files, opts } = parse(["a.html", "b.html", "--out-dir", "x", "--fps", "24", "--seconds", "2"]);
  expect(files).toEqual(["a.html", "b.html"]);
  expect(opts).toMatchObject({ outDir: "x", fps: 24, seconds: 2, scale: 0.5 });
  expect(() => parse(["a.html", "--fps", "0"])).toThrow();
  expect(await main(["--help"])).toBe(0);
});

test("選択票: text を持つ案は画像の代わりに文を出す（確認画面用）", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    const html = build({ title: "確認", mode: "view", columns: [{ key: "C1", name: "URL", text: "前: a.github.io\n後: https://a.github.io/" }], rows: [{ key: "a", name: "a" }], images: "{file}-{row}.png" }, dir);
    expect(html).toContain('<div class="txt">前: a.github.io');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── 雛形と場面の並びの検査 ──
const SCAFFOLD = path.join(import.meta.dir, "../skills/motion-video/assets/scaffold");

/** 雛形を一時フォルダに写し、content.json を書き換えて検査する */
function withScaffold(edit: (content: any) => void, fn: (dir: string) => void) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "scaffold-"));
  try {
    cpSync(SCAFFOLD, dir, { recursive: true });
    const file = path.join(dir, "content.json");
    const content = JSON.parse(readFileSync(file, "utf8"));
    edit(content);
    writeFileSync(file, JSON.stringify(content, null, 2));
    fn(dir);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("雛形は場面の並びの検査を通り、index.html の窓も scenes と一致する", () => {
  const result = checkScenes(SCAFFOLD);
  expect(result.errors).toEqual([]);
  expect(result.scenes.map((s) => s.id)).toEqual(["title", "items", "focus", "ending"]);
  const index = readFileSync(path.join(SCAFFOLD, "index.html"), "utf8");
  expect(replaceBlock(index, windowLines(SCAFFOLD))).toBe(index);
});

test("場面の並びの検査: 長さの合計が尺と合わないと止まる", () => {
  withScaffold((c) => { c.scenes[3].length += 1; }, (dir) => {
    expect(checkScenes(dir).errors.some((e) => e.includes("長さの合計"))).toBe(true);
  });
});

test("場面の並びの検査: 前後の場面で部品の姿勢が違うと止まり、部品が swap で急に消えても止まる", () => {
  withScaffold((c) => { c.scenes[2].pose.start.boxes.x = 200; c.scenes[2].pose.end.boxes.x = 200; }, (dir) => {
    expect(checkScenes(dir).errors.some((e) => e.includes("姿勢が違う"))).toBe(true);
  });
  withScaffold((c) => { c.scenes[2].pose.start = {}; c.scenes[2].pose.end = {}; }, (dir) => {
    expect(checkScenes(dir).errors.some((e) => e.includes("急に消える"))).toBe(true);
  });
});

test("場面の並びの検査: 場面ごとの下限（見えている秒・拍の間）を割ると止まる", () => {
  withScaffold((c) => { c.scenes[2].limits.gaps.picks.each = 2; c.scenes[1].limits.shown = 10; }, (dir) => {
    const errors = checkScenes(dir).errors;
    expect(errors.some((e) => e.includes("beats.picks の 1 番目の間"))).toBe(true);
    expect(errors.some((e) => e.includes("場面 items が見えているのは"))).toBe(true);
  });
});

test("場面の並びの検査: 場面の長さを変えると窓が食い違い、scene-windows で書き直すと通る", () => {
  withScaffold((c) => { c.scenes[1].length += 2; c.scenes[3].length -= 2; }, (dir) => {
    expect(checkScenes(dir).errors.some((e) => e.includes("窓"))).toBe(true);
    const file = path.join(dir, "index.html");
    writeFileSync(file, replaceBlock(readFileSync(file, "utf8"), windowLines(dir)));
    expect(checkScenes(dir).errors).toEqual([]);
  });
});

test("見本の差し替え: scenes は場面の id ごとに重ね、music は music.json に重ね、時刻は id@拍 で書ける", () => {
  const content = { scenes: [{ id: "a", length: 4, beats: { x: 1, list: [1, 2] } }, { id: "b", length: 6, beats: {} }], title: { text: "t", sub: "s" } };
  const { content: next, music, warnings } = applyPatch(content, { beatSeconds: 0.5, duration: 5 }, { scenes: { a: { beats: { list: [3] } }, zz: {} }, title: { text: "u" }, music: { duration: 6 } });
  expect(next.scenes[0]).toEqual({ id: "a", length: 4, beats: { x: 1, list: [3] } });
  expect(next.title).toEqual({ text: "u", sub: "s" });
  expect(music).toEqual({ beatSeconds: 0.5, duration: 6 });
  expect(warnings).toEqual(["scenes に zz が無い"]);
  expect(toSeconds("b@2", { a: 0, b: 4 }, 0.5)).toBe(3);
  expect(toSeconds("1.25", {}, 0.5)).toBe(1.25);
  expect(() => toSeconds("c@1", { a: 0 }, 0.5)).toThrow();
});
