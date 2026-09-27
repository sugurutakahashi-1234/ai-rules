---
name: md-to-pdf
description: "Markdown を印刷・配布用の PDF に変換する。Mermaid の図（```mermaid ブロック）も描画した状態で PDF 化する。Use when 「PDF にして」「印刷できる形にして」と言われたとき、見積書・提案書・レポートを Markdown から成果物にするとき。"
---

# md-to-pdf（Markdown → PDF、Mermaid 対応）

md-to-pdf 単体は Mermaid を描画できないので、Mermaid を含む文書は mermaid-cli で図を SVG に落とした中間 Markdown を経由する 2 段変換にする。最終成果物は元 Markdown と同名の `.pdf` だけを残す。

## 前提

- `npx` が使える。初回は md-to-pdf と mermaid-cli がそれぞれ Chromium を落とす（数百 MB・数分）。ユーザーに一言伝える
- 日本語フォントは OS のものを拾うので設定不要

## 変換

Mermaid ブロックが無ければ 1 コマンド:

```bash
npx --yes md-to-pdf <input.md>
```

Mermaid ブロックがある（`grep -l '```mermaid' <input.md>` が当たる）場合:

```bash
cd <input.md のあるディレクトリ>
npx --yes -p @mermaid-js/mermaid-cli mmdc -i <input>.md -o <input>.processed.md -e svg
npx --yes md-to-pdf <input>.processed.md
mv <input>.processed.pdf <input>.pdf
rm <input>.processed.md <input>.processed-*.svg
```

出力先は入力と同じディレクトリ・同名（拡張子だけ `.pdf`）。中間ファイルは削除してリポジトリに残さない。

## 落とし穴

- md-to-pdf に `--dest-dir` オプションは無い。出力先は入力と同じディレクトリに固定
- mmdc が出す SVG は `./<input>.processed-1.svg` の相対参照。md-to-pdf をそのディレクトリ以外から実行すると図が読めないので、先に `cd` する
- 図の形式は SVG を使う（md-to-pdf が問題なく埋め込める）。PNG は SVG で崩れたときの代替
- 既存 PDF をビューアで開いたまま上書きするとロックで失敗することがある。「閉じてもう一度」をユーザーに頼む。手で編集した PDF を上書きする可能性があるときは先に確認する
