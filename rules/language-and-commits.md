---
root: false
targets: ["*"]
description: "言語の使い分けとコミットメッセージ規約"
---

# 言語とコミット

- 議論・コードコメント・ドキュメントは**日本語**で書く。
- コミットメッセージは **type が英語小文字・subject と body は日本語**。
  - 形式: `type(scope): 日本語の subject`（scope は任意）
  - 許容 type は**そのリポジトリの commitlint 設定（`commitlint.config.*` の `type-enum`）に従う**。release-please 等のリリース自動化が type に依存するリポジトリがあるため、リポジトリ間で語彙を無理に揃えない
  - commitlint 未導入のリポジトリでは `feat` / `fix` / `add` / `remove` / `rename` / `tweak` / `tune` / `refactor` / `docs` / `ci` / `chore` / `test` を使う（sugurutakahashi-1234/ai-rules の `templates/commitlint.config.mjs` の語彙）
  - 例: `tweak(ci): bun のバージョン指定を latest 追随へ統一`

## commitlint の前提

日本語 subject を書けるようにするため、既定から以下を変更している。新規リポジトリでも同じ設定を使う（テンプレート: sugurutakahashi-1234/ai-rules の `templates/commitlint.config.mjs`）。

- `subject-case` は無効（日本語 subject を許容）
- `header-max-length` は 120（複数領域にまたがる変更でも 1 行で説明できるように）
- `body-max-line-length` は無効（日本語の詳細説明を折り返さずに書けるように）
