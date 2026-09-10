---
root: true
targets: ["*"]
description: "ai-rules リポジトリでの作業指示"
---

# ai-rules

汎用 AI コーディングエージェント向けルール・スキルの**正本**。各リポジトリが rulesync の `sources` で取り込む。使い方は README が正本。

## このリポジトリの中身

| ディレクトリ | 何か | 消費側からの見え方 |
|---|---|---|
| `rules/` | 配布するルール（`.md` を直下に平置き） | `sources` の `rules` で名前指定して取得される |
| `skills/` | 配布するスキル（`<name>/SKILL.md`） | `sources` の `skills` で名前指定して取得される |
| `templates/` | rulesync では配布できない設定ファイル | 各リポジトリへ実ファイルをコピーして使う |
| `.rulesync/rules/main.md` | **このファイル**。このリポジトリで作業するとき用 | 配布されない |

`rules/` と `skills/` は配布物なので、`.rulesync/` 配下と混同しない。このリポジトリ自身のエージェント指示はこのファイルだけで、`sources` は使わない（自己参照になるため）。

## 書くときの決まり

- **ルールの `globs`**: 常時効かせたいものは `globs` を書かない。ファイル作業時だけでよいものは `globs` を書く（コンテキストの節約）。詳細は README
- **タグは切らない**。消費側は lock で固定するので、main に push すれば足りる。過去のタグは残っているが新しく作らない
- **派生スキル**（外部由来を改変して所有）は上流に追従しない。frontmatter の `source` と `forked_at` は由来の記録。上流に良い変更が出ていないかは `skills-review` で点検する
- **本文は「現在の正」を上書きする形で書く**。時系列ログにしない。経緯は git と issue が持つ

## 変更したら

1. `bun run sync:agents` で CLAUDE.md / AGENTS.md を再生成する（pre-commit フックでも自動で走る）
2. ルールやスキルを増減したら README の一覧表も直す
3. 消費側への反映は必要になったとき。zenshin 系は zenshin-infra の一括更新、個人リポは `rulesync install --update`

## 記録の置き場

- **使い方・現在の正** → README とルール本文
- **なぜそう決めたか・却下した選択肢・上流の対応待ち** → このリポジトリの issue
- 決定の経緯を README に書かない。読者は消費側で、知りたいのは使い方だけ
