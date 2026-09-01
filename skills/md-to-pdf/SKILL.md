---
name: md-to-pdf
description: >
  Markdownファイルを印刷・配布用のPDFに変換するスキル。
  Mermaidの図（```mermaid ブロック）を含むMarkdownでも、図をちゃんとレンダリングした状態でPDF化する。
  「PDFにして」「PDF化して」「印刷できる形にして」といった依頼で発動。
  見積書・提案書・レポート等、お客様に提出する資料をMarkdownから成果物化するときに使う。
---

# md-to-pdf Skill（Markdown → PDF変換・Mermaid対応）

> **Core Principle**: Markdownの表記を崩さず、Mermaid図もちゃんと描画した状態でPDFを出力する。変換は2段階（mmdc → md-to-pdf）で、中間ファイルは必ず最後に掃除する。

---

## いつ使うか

- お客様提出用の見積書・提案書・レポートをMarkdownからPDF化するとき
- ユーザーから「PDFにして」「PDF化して」「印刷できる形にして」と依頼されたとき

---

## 前提

- Node.js / npx が使えること（`which npx` で確認）
- 初回実行時は `md-to-pdf` と `@mermaid-js/mermaid-cli` がそれぞれ Chromium をダウンロードする（数百MB・数分かかる）。これはユーザーに一言伝える
- 日本語フォントはOSのフォントを自動で拾うので追加設定不要

---

## 変換フロー

### Step 1: 入力MarkdownにMermaidブロックが含まれるか判定

```bash
grep -l '```mermaid' <input.md>
```

ヒットした場合は Step 2 へ、なければ Step 3 へ直行。

### Step 2: Mermaidブロックを画像化（ヒット時のみ）

`@mermaid-js/mermaid-cli`（`mmdc`）でMarkdown内の ```mermaid ブロックをSVGに変換し、画像参照に置換した中間Markdownを生成する。

```bash
cd <入力ファイルのディレクトリ>
npx --yes -p @mermaid-js/mermaid-cli mmdc \
  -i <input.md> \
  -o <input>.processed.md \
  -e svg
```

- 出力: `<input>.processed.md`（画像参照に置換済み）と `<input>.processed-N.svg`（図ごと）
- **PNGではなくSVGを使う**こと。過去にPNGで試した経緯はないが、SVG出力で md-to-pdf が問題なく埋め込めることを確認済み
- 中間ファイルは同じディレクトリに生成されるので、必ず `cd` してから実行する（相対パス参照のため）

### Step 3: md-to-pdf でPDF生成

Mermaidありの場合は Step 2 で作った `<input>.processed.md` を、なければ元の `<input>.md` を入力にする。

```bash
npx --yes md-to-pdf <入力Markdown>
```

- 出力は入力と同じディレクトリに `<入力Markdownのベース名>.pdf` として生成される
- `--dest-dir` オプションは**存在しない**ので使わないこと（過去に試してエラーになった）

### Step 4: リネームと後片付け

Mermaidありで Step 2 を通した場合：

```bash
mv <input>.processed.pdf <input>.pdf
rm <input>.processed.md <input>.processed-*.svg
```

- 最終PDFのファイル名は必ず元Markdownと同名（拡張子だけ `.pdf`）にする
- 中間ファイル（`.processed.md` / `.processed-*.svg`）は**必ず削除**する。リポジトリに残さない

### Step 5: 成果物の確認と報告

```bash
ls -lh <出力PDF>
```

ファイルサイズを確認し、ユーザーに出力先パスを報告する。Mermaid図が含まれていた場合は「図も描画されています」と一言添える。

---

## 落とし穴・注意

- **既存PDFの上書き**: ユーザーが Preview.app 等で開いているとファイルロックで上書き失敗することがある。エラーが出たら「ビューアを閉じてもう一度」とユーザーに依頼する
- **PNG vs SVG**: mmdc の `-e png` は理屈上は動くが、まず SVG を試す。SVG でうまくいかない場合のみ PNG へフォールバック
- **パス依存**: mmdc の出力SVGは相対パス参照（`./<input>.processed-1.svg`）なので、md-to-pdf 実行時のカレントディレクトリが中間Markdownと同じでないと読めない。必ず `cd` してから実行する
- **複数のMermaidブロック**: mmdc は自動で連番を振ってくれる（`-1.svg`, `-2.svg`, ...）のでそのまま使える。削除時はワイルドカード `*.processed-*.svg` でまとめて消す
- **ドライラン不要**: 出力先は元Markdownと同じディレクトリ・同名（拡張子違い）なので、事前確認は不要。ただし既存PDFを上書きする場合はユーザーに一言確認する（特に手動編集したPDFがある場合）

---

## 実行例（このスキルが作られた経緯）

見積書 Markdown の変換で実際に使った手順：

```bash
cd docs  # 対象 Markdown のあるディレクトリへ

# Step 2: Mermaid → SVG + 中間MD
npx --yes -p @mermaid-js/mermaid-cli mmdc \
  -i 見積書_teller-ai_20260413.md \
  -o 見積書_teller-ai_20260413.processed.md \
  -e svg

# Step 3: 中間MD → PDF
npx --yes md-to-pdf 見積書_teller-ai_20260413.processed.md

# Step 4: リネーム + 後片付け
mv 見積書_teller-ai_20260413.processed.pdf 見積書_teller-ai_20260413.pdf
rm 見積書_teller-ai_20260413.processed.md 見積書_teller-ai_20260413.processed-1.svg
```

所要時間: 初回 Chromium ダウンロード含めて数分。2回目以降は数秒。
