import { expect, test } from "bun:test";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chord, synth, wav } from "../skills/motion-video/scripts/beat-music";
import { closeness, draw, loadCatalog, loadHistory } from "../skills/motion-video/scripts/draw";
import { build, check } from "../skills/motion-video/scripts/picker";
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
    expect(html.match(/<button class="keep"/g)).toHaveLength(1);
    expect(html).toContain('"mode":"view"');
    expect(html).toContain('placeholder="この直しへの一言（任意）"'); // 確認用のページは「案」ではなく「直し」
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
    expect(html).toContain('<div class="txt"><p>前: a.github.io</p><p>後: https://a.github.io/</p></div>');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("選択票: 案が文だけのページは縦に 1 列で並べ、文は行ごと・番号つきの並び・段落の間に分ける", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    writeFileSync(path.join(dir, "R1-a.png"), "");
    const html = build({
      title: "確認",
      pages: [
        { title: "進め方", mode: "keep", keep: 1, columns: [{ key: "U1", name: "案 1", text: "1. 開く\n2. 足す\n\n補足" }, { key: "U2", name: "案 2", text: "一行" }], rows: [{ key: "a", name: "a" }], recommend: { key: "U1" } },
        { title: "直した点", mode: "view", columns: [{ key: "R1", name: "絵" }, { key: "C1", name: "文", text: "a" }], rows: [{ key: "a", name: "a" }], images: "{file}-{row}.png" },
      ],
    }, dir);
    expect(html).toContain('<section class="page narrow" data-p="0">');
    expect(html).toContain('<div class="grid list">');
    expect(html).toContain('<section class="page" data-p="1">'); // 画像の混ざるページは横並びのまま
    expect(html).toContain('<ol><li value="1">開く</li><li value="2">足す</li></ol><p class="gap"></p><p>補足</p>');
    expect(html).toContain('<b>U1</b><span class="nm">案 1</span><span class="rec">おすすめ</span><button class="keep" data-label="これにする">これにする</button>');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("選択票: 選ぶボタンの言葉は場面で変わり、ページの button で上書きできる", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    const cols = [{ key: "A", name: "a", text: "x" }, { key: "B", name: "b", text: "y" }];
    const rows = [{ key: "r", name: "" }];
    expect(build({ title: "足切り", mode: "keep", keep: 3, columns: cols, rows }, dir)).toContain('data-label="候補に残す">候補に残す</button>');
    expect(build({ title: "決める", mode: "keep", keep: 1, columns: cols, rows }, dir)).toContain('data-label="これにする">これにする</button>');
    expect(build({ title: "件ごと", mode: "pick", columns: [{ key: "A", name: "a" }], rows, images: "{file}-{row}.png" }, dir)).toContain('<button class="pick" data-label="これにする">これにする</button>');
    expect(build({ title: "件ごと", mode: "pick", columns: cols, rows }, dir)).toContain('<div class="opt" data-row="r" data-col="A"><div class="dot"></div><div class="name">A a</div>'); // 文の案はラジオ風で、名前がそのまま出る
    expect(build({ title: "好きに", mode: "keep", keep: 1, button: "この文にする", columns: cols, rows }, dir)).toContain('data-label="この文にする">この文にする</button>');
    expect(build({ title: "決める", mode: "keep", keep: 1, columns: cols, rows }, dir)).toContain('b.textContent = on ? "選択中" : b.dataset.label'); // 押した後は「選択中」
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("選択票: before / after は「直す前」「直した後」の 2 段になり、{+ +} と {- -} は ins / del になる", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    const html = build({
      title: "確認", mode: "view", rows: [{ key: "r", name: "" }],
      columns: [{ key: "L12", name: "導入", before: "正本{-を管理する-}", after: "正本{+。rulesync で取り込む+}" }, { key: "L40", name: "手順", after: "{+1. 書く+}\n{+2. 回す+}" }],
    }, dir);
    expect(html).toContain('<div class="ba"><div class="b"><span class="lbl">直す前</span><div class="t"><p>正本<del>を管理する</del></p></div></div><div class="a"><span class="lbl">直した後</span><div class="t"><p>正本<ins>。rulesync で取り込む</ins></p></div></div></div>');
    expect(html).toContain('<div class="a"><span class="lbl">直した後</span><div class="t"><ol><li value="1"><ins>書く</ins></li><li value="2"><ins>回す</ins></li></ol></div></div>'); // before 無しは直した後だけ
    expect(html).toContain('<span class="legend"><ins>足す</ins>／<del>消す</del></span>'); // 印があるページだけ凡例
    expect(html).toContain('<section class="page narrow" data-p="0">'); // 文だけなので縦 1 列
    expect(html).not.toContain("&lt;ins&gt;"); // 印は HTML エスケープのあとで置く
    expect(build({ title: "印なし", mode: "view", rows: [{ key: "r", name: "" }], columns: [{ key: "A", name: "a", text: "x" }] }, dir)).not.toContain('class="legend"');
    const triage = build({ title: "仕分け", mode: "view", labels: ["元の件", "扱い"], rows: [{ key: "r", name: "" }], columns: [{ key: "1", name: "a", before: "x", after: "落とす" }] }, dir);
    expect(triage).toContain('<span class="lbl">元の件</span>');
    expect(triage).toContain('<span class="lbl">扱い</span>');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("選択票: pick で件ごとに文の案を置けて、現状・理由・件ごとのおすすめが出る。文の案に「この方向でもっと」は付かない", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    const html = build({
      title: "指摘", mode: "pick", recommend: { key: "A" },
      columns: [{ key: "A", name: "案A" }, { key: "B", name: "案B" }, { key: "K", name: "このまま", text: "直さない" }],
      rows: [
        { key: "i1", name: "#12 導入", why: "誰が読むかが無い", now: "正本。", text: { A: "正本。{+取り込む。+}", B: "{-汎用-}正本。" } },
        { key: "i2", name: "#40 手順", recommend: "B", text: { A: "a", B: "b" } },
      ],
    }, dir);
    expect(html).toContain('<section class="page narrow" data-p="0">'); // 文の案は縦 1 列
    expect(html).toContain('<h3>#12 導入</h3><p class="point">誰が読むかが無い</p><div class="now"><span class="lbl">現状</span><div class="t"><p>正本。</p></div></div><div class="opts">');
    expect(html).toContain('<div class="opt isrec" data-row="i1" data-col="A"><div class="dot"></div><div class="name">A 案A<span class="rec">おすすめ</span></div><div class="obody"><div class="txt"><p>正本。<ins>取り込む。</ins></p></div></div></div>');
    expect(html).toContain('<div class="opt" data-row="i1" data-col="K"><div class="dot"></div><div class="name">K このまま</div><div class="obody"><div class="txt"><p>直さない</p></div></div></div>'); // 列の text は全部の件に共通
    expect(html).toContain('<div class="opt isrec" data-row="i2" data-col="B"><div class="dot"></div><div class="name">B 案B<span class="rec">おすすめ</span></div><div class="obody"><div class="txt"><p>b</p></div></div></div>'); // 件ごとのおすすめが優先
    expect(html).toContain('<div class="opt" data-row="i2" data-col="A"><div class="dot"></div><div class="name">A 案A</div><div class="obody"><div class="txt"><p>a</p></div></div></div>');
    expect(html).not.toContain('class="more"');
    expect(html).toContain('placeholder="この件への一言・自分で直した文（任意）"');
    expect(html).toContain('"rows":[["i1","#12 導入","A",0,null],["i2","#40 手順","B",0,null]]'); // 推す案を最初から選ぶのと、未選択のときの「おすすめで進める」に使う
    expect(html).toContain("s.pages[i].pick[r] = rec");
    expect(html).toContain('"未選択 → おすすめ "');
    expect(check({ title: "x", mode: "pick", columns: [{ key: "A", name: "a" }], rows: [{ key: "r", name: "r" }] })).toContain("images が無いなら");
    expect(check({ title: "x", mode: "pick", columns: [{ key: "A", name: "a" }], rows: [{ key: "r", name: "r", text: { A: "t" } }] })).toBeNull();
    expect(check({ title: "x", mode: "pick", rows: [{ key: "r", name: "r" }] })).toContain("options / ask");
    expect(check({ title: "x", mode: "pick", rows: [{ key: "r", name: "r", ask: "答えを" }] })).toBeNull();
    // 件ごとの案（options）と、文で答える問い（ask）。列が無くても選択票になる
    const own = build({
      title: "仕分け", mode: "pick",
      rows: [
        { key: "t1", name: "#13 登録", why: "落とせるか", now: "元の文", recommend: "A", options: [{ key: "A", name: "落とす", pros: "1 件減る", cons: "手がかりが消える" }, { key: "B", name: "残す" }] },
        { key: "q1", name: "#15 習慣", why: "意味", ask: "分からなければ「不明」" },
      ],
    }, dir);
    expect(own).toContain('<div class="opt isrec" data-row="t1" data-col="A"><div class="dot"></div><div class="name">A 落とす<span class="rec">おすすめ</span></div><div class="md"><span class="m">1 件減る</span><span class="d">手がかりが消える</span></div></div>');
    expect(own).toContain('<div class="opt" data-row="t1" data-col="B"><div class="dot"></div><div class="name">B 残す</div></div>');
    expect(own).toContain('<section class="row ask" data-row="q1"><h3>#15 習慣</h3><p class="point">意味</p><textarea class="memo" data-memo="q1" placeholder="分からなければ「不明」"></textarea></section>');
    expect(own).toContain('"mode":"pick"');
    expect(own).toContain('"rows":[["t1","#13 登録","A",0,{"A":"落とす","B":"残す"}],["q1","#15 習慣",null,1,null]]');
    const pic = build({ title: "絵", mode: "pick", columns: [{ key: "A", name: "a" }], rows: [{ key: "r", name: "r" }], images: "{file}-{row}.png" }, dir);
    expect(pic).toContain('<button class="more">この方向でもっと</button>'); // 絵の案には今までどおり付く
    expect(build({ title: "絵", mode: "pick", more: false, columns: [{ key: "A", name: "a" }], rows: [{ key: "r", name: "r" }], images: "{file}-{row}.png" }, dir)).not.toContain('class="more"');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("選択票: check は決めた扱いを 1 件 1 行で見せ、違う件だけ「戻す」。開けば確認済みになる", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "picker-"));
  try {
    const html = build({
      title: "仕分け",
      pages: [
        { title: "先に片付ける 2 件", mode: "check", tag: "落とす", tags: [{ name: "落とす", meaning: "期間切れ", tone: "red" }, { name: "片付いた", tone: "green" }], rows: [{ key: "n1", name: "#1 週次", sub: "9/1 から", why: "期間切れ" }, { key: "n2", name: "#2 上位目標", tag: "片付いた", why: "今日作り直した" }] },
        { title: "選ぶ", mode: "keep", keep: 1, rows: [{ key: "r", name: "" }], columns: [{ key: "A", name: "a", text: "x" }] },
      ],
    }, dir);
    expect(html).toContain('<div class="chk" data-row="n1"><span class="tagc red">落とす</span><div class="cbody"><b>#1 週次</b><span class="cwhy">期間切れ</span><small>9/1 から</small></div><button class="undo" data-label="戻す">戻す</button>');
    expect(html).toContain('<span class="tagc green">片付いた</span><div class="cbody"><b>#2 上位目標</b><span class="cwhy">今日作り直した</span></div>'); // 行の tag がページの tag より優先。色は tags から
    expect(html).toContain('<div class="tlegend"><span><span class="tagc red">落とす</span><span class="tm">期間切れ</span></span><span><span class="tagc green">片付いた</span></span></div>'); // 凡例はページの頭
    expect(html).toContain('<section class="page narrow" data-p="0">'); // 幅は文のページと同じ
    expect(html).toContain('"mode":"check"');
    expect(html).toContain('C.pages[i].mode === "check"'); // 開けば確認済み（view と同じ扱い）
    expect(html).toContain('" 件ともそのまま"');
    expect(check({ title: "x", mode: "check" })).toContain("rows が要る");
    expect(check({ title: "x", mode: "check", rows: [{ key: "a", name: "a" }] })).toBeNull();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("design-compare の picker.ts は motion-video と同じ中身（スキルごとに持つが、育てるのは 1 本）", () => {
  const a = readFileSync(path.join(import.meta.dir, "../skills/motion-video/scripts/picker.ts"), "utf8");
  const b = readFileSync(path.join(import.meta.dir, "../skills/design-compare/scripts/picker.ts"), "utf8");
  expect(b).toBe(a);
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
