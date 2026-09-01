# ai-rules

個人（sugurutakahashi-1234）の **汎用 AI コーディングエージェント向けルール・スキルの正本**。
[rulesync](https://github.com/dyoshikawa/rulesync) の宣言的ソースとして、業務・個人を問わず各リポジトリから取り込む。

会社・案件固有のルールはここには置かない。各社のルールリポジトリ（例: `ZENSHIN-Inc/zenshin-ai-rules`）に置き、消費側の `rulesync.jsonc` で両方を `sources` に並べる。

## これはメニューであって、強制ではない

このリポジトリは「全リポジトリが従うべき規格」ではなく、**各リポジトリが必要なものだけ選んで取り込む品揃え**。選ぶのは**消費側**。

## 使い方

各リポジトリの `rulesync.jsonc` に `sources` を書く。参照は必ずタグで固定する。

```jsonc
{
  "targets": ["claudecode", "codexcli"],
  "features": ["rules", "skills"],
  "sources": [
    {
      "source": "sugurutakahashi-1234/ai-rules@v1.0.0",
      "rules": ["language-and-commits", "git-safety", "code-conventions"]
    }
  ]
}
```

`rules` だけを書けば skills は取得されない。**`"skills": []` と書いてはいけない**（「skills を選択したが 0 件一致」と解釈されて install が失敗する）。
逆に `rules` と `skills` を**両方省略すると全 skills が取得される**（後方互換仕様）。どちらの罠も踏まないよう `rules` は必ず明示する。

## ルールを書くときの注意（globs の使い分け）

frontmatter の `globs` は「どのファイルを触るときに適用するか」。Claude Code 向け生成物では `paths` になり、**`globs` 付きルールは該当ファイルを読み書きするまで読み込まれない**。

- **常時効かせたいルール**（git 操作の禁止事項、言語・コミット規約など）→ `globs` を**書かない**（セッション開始時に必ず読まれる）
- **ファイル作業時だけ効けばよいルール**（コーディング規約など）→ `globs: ["**/*"]` などを書く（コンテキストの節約になる）

## ルール一覧

| ルール | globs | 内容 |
|---|---|---|
| `git-safety` | なし（常時） | 破壊的な git 操作の禁止 |
| `language-and-commits` | なし（常時） | 日本語の使い分けとコミット規約（type 英語・subject 日本語） |
| `code-conventions` | `**/*` | コーディング規約（コメントは WHY のみ、UTC/JST 等） |
| `skill-layering` | スキル関連 | スキル・ルールを新設するときの置き場所判断（知見の集約先） |

## スキル一覧

**自作・汎用**（会社依存を除去して昇格したもの）:

| スキル | 内容 | 備考 |
|---|---|---|
| `design-compare` | デザイン案を 1 枚の比較モックにして選んでもらう | |
| `image-gen` | Codex 経由 gpt-image-2 の呼び出し規約・並列一括生成 | `scripts/parallel-imggen.sh` 同梱 |
| `md-infographic` | 章扉インフォグラフィックのスタイル定型 | **前提: `image-gen` も併せて導入** |
| `github-issue-infographic` | GitHub issue へのインフォグラフィック差し込み | **前提: `image-gen` も併せて導入** |
| `md-to-visual-html` 系は各リポ側 | — | HTML 設計の正本は会社層・リポ層にある |
| `md-to-pdf` | Markdown→PDF の 2 段変換手順 | |
| `drawio-diagram` | draw.io 図の作成・書き出し・自己チェック | agents/references/scripts 同梱 |

**外部由来（vendored）**: `accessibility` / `core-web-vitals` / `web-quality-audit`（addyosmani/web-quality-skills, MIT）、`seo-audit` / `ai-seo` / `schema` / `cro`（coreyhaines31/marketingskills, MIT）、`frontend-design`（anthropics/skills）、`web-design-guidelines`（vercel-labs）。frontmatter の source / revision が追従の基準。LICENSE を同梱し、本文冒頭に出典を明記。

## sync のタイミング

rulesync は**コマンドを打ったときだけ**動く（自動では走らない）。sync し忘れを構造的に無くすため、消費側では lefthook の pre-commit フックで自動 sync する（`templates/lefthook.yml` の `rulesync-generate` ブロック）。`.rulesync/` や `rulesync.jsonc` をステージしてコミットすると、生成物が再生成されて同じコミットに含まれる。generate はコミット済みの取得物 `.curated/` を読むだけなのでオフラインで数秒。CI の drift チェックは保険として残す。

## templates/ — rulesync の配布対象外のもの

git フック等の設定ファイルは rulesync では配布できない（rulesync が扱うのはエージェント指示のみ）。各リポジトリへ実ファイルをコピーして使う。

- `templates/lefthook.yml` — commit-msg で commitlint、pre-commit で rulesync 自動 sync。**既存の lefthook.yml があるリポジトリでは上書きせずマージする**
- `templates/commitlint.config.mjs` — `language-and-commits` ルールと対をなす commitlint 設定（commitlint 未導入リポジトリ向け。既存設定があるリポジトリはそちらを正とする）

導入（消費側リポジトリで）:

```bash
bun add -d lefthook @commitlint/cli @commitlint/config-conventional
cp <このリポ>/templates/lefthook.yml <このリポ>/templates/commitlint.config.mjs .
bunx lefthook install
```

複数リポジトリへの一斉配布は zenshin-cto の multi-repo を使う。

## 消費側の既知の落とし穴

- **フォーマッタと取得物の衝突**: oxfmt / prettier 等が `.rulesync/`（`.curated/` 含む）や生成物（CLAUDE.md / AGENTS.md / .claude/ / .agents/）を整形すると、`rulesync.lock` の sha256 検証と `generate --check` が崩れる。**フォーマッタの ignore に必ず両方を入れる**
- **同梱スクリプトの実行ビット**: rulesync は生成時に 755 を保持しない（[dyoshikawa/rulesync#2866](https://github.com/dyoshikawa/rulesync/issues/2866)）。スキル本文では `bash scripts/foo.sh` と明示呼び出しで書く
- **増分 generate の delete 取りこぼし**: `delete: true` でも、source 内の一部ファイル削除だけの増分実行では残骸が残ることがある（[dyoshikawa/rulesync#2867](https://github.com/dyoshikawa/rulesync/issues/2867)）。スキルからファイルを削除したときは `sync-agents` を手で一度回して生成物を確認する

## バージョニング

- 消費側は `@vX.Y.Z` のタグ参照で固定し、`rulesync.lock` をコミットする（取得内容は commit SHA と sha256 で再現される）
- ルールを変更したら新しいタグを切る。既存タグは動かさない
- 消費側の取り込みは `rulesync.jsonc` のタグを上げて `rulesync install` → 生成物と lock をコミット
