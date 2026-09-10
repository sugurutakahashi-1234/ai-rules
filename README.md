# ai-rules

個人（sugurutakahashi-1234）の **汎用 AI コーディングエージェント向けルール・スキルの正本**。
[rulesync](https://github.com/dyoshikawa/rulesync) の宣言的ソースとして、業務・個人を問わず各リポジトリから取り込む。

会社・案件固有のルールはここには置かない。所属組織ごとのルールリポジトリに置き、消費側の `rulesync.jsonc` で両方を `sources` に並べる。

**これはメニューであって、強制ではない。** 「全リポジトリが従うべき規格」ではなく、**各リポジトリが必要なものだけ選んで取り込む品揃え**。選ぶのは消費側。

## ルール

| ルール | globs | 内容 |
|---|---|---|
| `git-safety` | なし（常時） | 破壊的な git 操作の禁止 |
| `language-and-commits` | なし（常時） | 日本語の使い分けとコミット規約（type 英語・subject 日本語） |
| `code-conventions` | `**/*` | コーディング規約（コメントは WHY のみ、UTC/JST 等） |
| `japanese-writing` | `**/*.md` | 日本語の文体規範。AI 生成文に出やすい癖（空虚な形容・予告・対句・翻訳調）の禁止 |
| `skill-layering` | スキル関連 | スキル・ルールを新設するときの置き場所判断（知見の集約先） |

`globs` 付きのルールは、該当ファイルを読み書きするまで読み込まれない。常時効かせたいものには `globs` を書かない。

## スキル

| スキル | 内容 | 備考 |
|---|---|---|
| `design-compare` | デザイン案や Markdown 文書の構成案を 1 枚の比較モックにして選んでもらう | |
| `image-gen` | Codex 経由 gpt-image-2 の呼び出し規約・並列一括生成 | `scripts/parallel-imggen.sh` 同梱 |
| `md-infographic` | 章扉インフォグラフィックのスタイル定型 | **前提: `image-gen` も併せて導入** |
| `github-issue-infographic` | GitHub issue へのインフォグラフィック差し込み | **前提: `image-gen` も併せて導入** |
| `md-to-pdf` | Markdown→PDF の 2 段変換手順 | |
| `drawio-diagram` | draw.io 図の作成・書き出し・自己チェック | agents/references/scripts 同梱 |
| `skills-review` | 導入済みスキルの棚卸し・追従の遅れ・上位互換の探索・提案表 | 月 1 の定期点検用。`scripts/inventory.sh` 同梱 |

**派生（外部由来を改変して所有）**: `accessibility` / `core-web-vitals` / `web-quality-audit`（由来: addyosmani/web-quality-skills, MIT）、`seo-audit` / `ai-seo` / `schema` / `cro`（由来: coreyhaines31/marketingskills, MIT）、`web-design-guidelines`（由来: vercel-labs/web-interface-guidelines, MIT）。本文を大きく書き換えているため上流には追従しない。frontmatter の `source` / `forked_at` は由来の記録で、LICENSE を同梱し本文冒頭に由来を明記する。取り込む価値のある変更が上流に出ていないかは `skills-review` で点検する。

**他人のスキルはここにコピーしない。** 消費側の `sources` に上流リポを直接書き、追従は rulesync に任せる。本文に手を入れたくなったら、コピーして上の「派生」として所有する。中途半端に「コピーして少し直した」状態を残さない。

```jsonc
{ "source": "coji/natural-japanese", "skills": ["natural-japanese"] }
```

## 使い方

各リポジトリの `rulesync.jsonc` に `sources` を書く。参照にタグは付けず、デフォルトブランチを追う。固定は `rulesync.lock`（commit SHA と sha256）が担う。

```jsonc
{
  "targets": ["claudecode", "codexcli"],
  "features": ["rules", "skills"],
  "sources": [
    {
      "source": "sugurutakahashi-1234/ai-rules",
      "rules": ["language-and-commits", "git-safety", "code-conventions"]
    }
  ]
}
```

- `rulesync install` は lock 通りに取得する（初回は HEAD を解決して lock に書く）
- CI は `rulesync doctor --strict && rulesync install --frozen && rulesync generate --check` の 3 段。doctor は設定の書き間違いを、あとの 2 つは lock との乖離を検出する
- 戻したいときは lock を revert する。タグは切らない

**罠が 3 つある。**

- `"skills": []` と書いてはいけない（「skills を選択したが 0 件一致」と解釈されて install が失敗する）。`rules` と `skills` を両方省略すると全 skills が取得されるので、`rules` は必ず明示する
- `skills` の選定を変えても `install` は取りに行かない。`--update` が要る（上流 issue [#2982](https://github.com/dyoshikawa/rulesync/issues/2982) 待ち）
- フォーマッタが `.rulesync/`（`.curated/` 含む）や生成物（CLAUDE.md / AGENTS.md / .claude/ / .agents/）を整形すると lock の sha256 検証が崩れる。**oxfmt / prettier の ignore に両方を入れる**

## 更新の追従

**自動追従はしない。** `rulesync.lock` は npm / bun の lock と同じ思想で、バージョン範囲という概念がなく、`install --update` を打たない限り取得内容は動かない。追従は「上げたいときに上げる」でよく、忘れても lock 固定で古いまま安定して動く。

```bash
rulesync install --update && rulesync generate
```

- このリポジトリを変更したら main に push するだけでよい。タグは切らない
- 複数リポジトリを一度に上げるなら、clone を横断して同じことをするスクリプトを 1 本持つとよい（dirty なリポジトリはスキップし、lock と上流 HEAD の差を先に見られる形にする）
- 追従忘れの受け皿は `skills-review` スキル。月 1 の棚卸しで、lock の遅れ・外部スキルの更新・上位互換をまとめて点検する
- **sync し忘れ**は別問題で、lefthook の pre-commit（`templates/lefthook.yml`）が防ぐ。`.rulesync/` や `rulesync.jsonc` をステージすると生成物が再生成されて同じコミットに入る

## templates/ — rulesync では配布できないもの

git フック等の設定ファイルは rulesync の管轄外（rulesync が扱うのはエージェント指示のみ）。各リポジトリへ実ファイルをコピーして使う。

- `templates/lefthook.yml` — commit-msg で commitlint、pre-commit で rulesync 自動 sync。任意で textlint。**既存の lefthook.yml があるリポジトリでは上書きせずマージする**
- `templates/commitlint.config.mjs` — `language-and-commits` ルールと対をなす commitlint 設定（既存設定があるリポジトリはそちらを正とする）
- `templates/.textlintrc.json` — `japanese-writing` ルールと対をなす textlint 設定（どのルールを切るかはファイル内のコメント参照）

```bash
bun add -d lefthook @commitlint/cli @commitlint/config-conventional
cp <このリポ>/templates/lefthook.yml <このリポ>/templates/commitlint.config.mjs .
bunx lefthook install
# 文章が主体のリポジトリなら
bun add -d textlint @textlint-ja/textlint-rule-preset-ai-writing
cp <このリポ>/templates/.textlintrc.json .
```

## 参考: グローバルに入れるスキル（ガードレール型 6 本）

ここから配るものではないが、環境全体の設計として対になる話。グローバルスキルは**どのリポジトリで作業していても description がプロンプトに載る**ので、置くのはモデルが自力では守れない「考え方の境界」を引くものだけにする。手順型・成果物の型（比較モック、PDF 変換、図の書き出しなど）は上の `sources` で取る。判断基準は `skill-layering` ルールの「何をスキル・ハーネスとして残すか」が正本。

| スキル | 上流 | 何をするか |
|---|---|---|
| `grill-me` | mattpocock/skills | 計画や設計を、作り始める前に容赦なく問い詰めて磨く。曖昧なまま実装に入るのを止める |
| `grill-with-docs` | mattpocock/skills | 同じ問い詰めをしながら、決まったことを ADR と用語集として書き出す |
| `domain-modeling` | mattpocock/skills | プロジェクトの用語と概念を整理する。CONTEXT.md や ADR を書く・直すとき |
| `wayfinder` | mattpocock/skills | 1 セッションに収まらない大きな作業を、issue 上の決定チケットの地図にして 1 つずつ解いていく |
| `skill-creator` | anthropics/skills | スキルの新規作成・改善・description の最適化・eval による性能測定 |
| `find-skills` | vercel-labs/skills | 「こういうことをしたい」から、導入できる既存スキルを探す |

[skills CLI](https://github.com/vercel-labs/skills) で入れる。`-a claude-code -a codex` を付けると実体が `~/.agents/skills/` の 1 つになり、各エージェントからは symlink で参照されるので、更新すれば両方に同時に反映される。

```bash
npx -y skills@latest add mattpocock/skills -g -s grill-me -s grill-with-docs -s domain-modeling -s wayfinder -a claude-code -a codex -y
npx -y skills@latest add anthropics/skills -g -s skill-creator -a claude-code -a codex -y
npx -y skills@latest add vercel-labs/skills -g -s find-skills -a claude-code -a codex -y
```

`-g` がグローバル、`-s` が個別指定（省くと全スキルが入る）。導入時のコミットで固定されるので、最新にするのは `npx -y skills@latest update -g -y`。自動更新は仕込まない（rulesync 側と同じく、上げたいときに上げる）。追従忘れの受け皿は `skills-review` スキル。
