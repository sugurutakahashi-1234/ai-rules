# ai-rules

個人（sugurutakahashi-1234）の **汎用 AI コーディングエージェント向けルール・スキルの正本**。
[rulesync](https://github.com/dyoshikawa/rulesync) の宣言的ソースとして、業務・個人を問わず各リポジトリから取り込む。

会社・案件固有のルールはここには置かない。所属組織ごとのルールリポジトリに置き、消費側の `rulesync.jsonc` で両方を `sources` に並べる。

## これはメニューであって、強制ではない

このリポジトリは「全リポジトリが従うべき規格」ではなく、**各リポジトリが必要なものだけ選んで取り込む品揃え**。選ぶのは**消費側**。

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
- 最新へ追従するのは `rulesync install --update`。lock の差分を見てからコミットする
- CI は `rulesync doctor --strict && rulesync install --frozen && rulesync generate --check` の 3 段。doctor は設定の書き間違いを、あとの 2 つは lock との乖離を検出する
- 戻したいときは lock を revert する。タグは切らない

`rules` だけを書けば skills は取得されない。**`"skills": []` と書いてはいけない**（「skills を選択したが 0 件一致」と解釈されて install が失敗する）。
逆に `rules` と `skills` を**両方省略すると全 skills が取得される**（後方互換仕様）。どちらの罠も踏まないよう `rules` は必ず明示する。

## 外部スキルは sources で直接参照する

他人が公開しているスキルは、このリポジトリにコピーせず、消費側の `sources` に上流リポを直接書く。追従は rulesync に任せる。

```jsonc
{ "source": "coji/natural-japanese", "skills": ["natural-japanese"] }
```

- `coji/natural-japanese` — 仕事の日本語文書（議事録・レポート・企画書・記事）を設計から書く。AI 臭の除去を工程に含む

本文に手を入れたくなったら、コピーして「派生」としてこのリポジトリで所有する（下のスキル一覧を参照）。中途半端に「コピーして少し直した」状態を残さない。

## グローバルに入れるスキル（ガードレール型 6 本）

グローバルスキルは**どのリポジトリで作業していても description がプロンプトに載る**。だからここに置くのは、モデルが自力では守れない「考え方の境界」を引くものだけにする。手順型・成果物の型（比較モック、PDF 変換、図の書き出しなど）はコンテキストを食うだけなので、使うリポジトリの `sources` に入れる。判断基準は `skill-layering` ルールの「何をスキル・ハーネスとして残すか」が正本。

| スキル | 上流 | 何をするか |
|---|---|---|
| `grill-me` | mattpocock/skills | 計画や設計を、作り始める前に容赦なく問い詰めて磨く。曖昧なまま実装に入るのを止める |
| `grill-with-docs` | mattpocock/skills | 同じ問い詰めをしながら、決まったことを ADR と用語集として書き出す |
| `domain-modeling` | mattpocock/skills | プロジェクトの用語と概念を整理する。CONTEXT.md や ADR を書く・直すとき |
| `wayfinder` | mattpocock/skills | 1 セッションに収まらない大きな作業を、issue 上の決定チケットの地図にして 1 つずつ解いていく |
| `skill-creator` | anthropics/skills | スキルの新規作成・改善・description の最適化・eval による性能測定 |
| `find-skills` | vercel-labs/skills | 「こういうことをしたい」から、導入できる既存スキルを探す |

### 導入（Claude Code と Codex の両方に入る）

[skills CLI](https://github.com/vercel-labs/skills) を使う。`-a claude-code -a codex` を付けると、実体を `~/.agents/skills/` に 1 つだけ置き、各エージェントのディレクトリからは symlink で参照する形になる。実体が 1 つなので、更新すれば Claude Code と Codex の両方に同時に反映される。

```bash
npx -y skills@latest add mattpocock/skills -g -s grill-me -s grill-with-docs -s domain-modeling -s wayfinder -a claude-code -a codex -y
npx -y skills@latest add anthropics/skills -g -s skill-creator -a claude-code -a codex -y
npx -y skills@latest add vercel-labs/skills -g -s find-skills -a claude-code -a codex -y
```

`-g` がグローバル、`-s` が個別指定。`-s` を省くとそのリポジトリの全スキルが入るので必ず選ぶ。

### 最新に保つ

skills CLI はインストール時のコミットで固定する（自動追従しない）。更新は次のコマンドで、`~/.agents/.skill-lock.json` に記録されたソースを見て差分だけ取り直す。

```bash
npx -y skills@latest update -g -y   # 更新
npx -y skills@latest list -g        # 現在の一覧
npx -y skills@latest remove -g <名前>  # 外す
```

打ち忘れを防ぐなら、**この 3 行の導入コマンドを持つリポジトリ**（マシン設定リポジトリなど）の `.claude/settings.json` に `SessionStart` フックを置き、スロットル付きで `update -g` を走らせる。グローバル設定（`~/.claude/settings.json`）には置かない。マシン管理の仕事はマシン設定リポジトリの管轄で、どのスキルを入れているかの台帳もそのコマンド自体が兼ねる。

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "f=\"$HOME/.agents/.skills-update-stamp\"; now=$(date +%s); last=$(stat -f %m \"$f\" 2>/dev/null || echo 0); if [ $((now - last)) -gt 604800 ]; then touch \"$f\"; npx -y skills@latest update -g -y > \"$HOME/.agents/last-skills-update.log\" 2>&1; fi",
            "async": true,
            "timeout": 300,
            "statusMessage": "グローバルスキルを更新中…"
          }
        ]
      }
    ]
  }
}
```

## このリポジトリ自身の設定

`rulesync.jsonc` と `.rulesync/rules/main.md` は、**このリポジトリで作業するエージェント向けの指示**（`CLAUDE.md` / `AGENTS.md` を生成する）。配布物である `rules/` ・ `skills/` とは別物で、消費側には配布されない。`sources` は使わない（自分自身を参照すると循環するため）。

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
| `japanese-writing` | `**/*.md` | 日本語の文体規範。AI 生成文に出やすい癖（空虚な形容・予告・対句・翻訳調）の禁止 |
| `skill-layering` | スキル関連 | スキル・ルールを新設するときの置き場所判断（知見の集約先） |

## スキル一覧

**自作・汎用**:

| スキル | 内容 | 備考 |
|---|---|---|
| `design-compare` | デザイン案や Markdown 文書の構成案を 1 枚の比較モックにして選んでもらう | |
| `image-gen` | Codex 経由 gpt-image-2 の呼び出し規約・並列一括生成 | `scripts/parallel-imggen.sh` 同梱 |
| `md-infographic` | 章扉インフォグラフィックのスタイル定型 | **前提: `image-gen` も併せて導入** |
| `github-issue-infographic` | GitHub issue へのインフォグラフィック差し込み | **前提: `image-gen` も併せて導入** |
| `md-to-pdf` | Markdown→PDF の 2 段変換手順 | |
| `drawio-diagram` | draw.io 図の作成・書き出し・自己チェック | agents/references/scripts 同梱 |
| `skills-review` | 導入済みスキルの棚卸し・上流の生存確認・上位互換の探索・提案表 | 月 1 の定期点検用。`scripts/inventory.sh` 同梱 |

**派生（外部由来を改変して所有）**: `accessibility` / `core-web-vitals` / `web-quality-audit`（由来: addyosmani/web-quality-skills, MIT）、`seo-audit` / `ai-seo` / `schema` / `cro`（由来: coreyhaines31/marketingskills, MIT）、`web-design-guidelines`（由来: vercel-labs/web-interface-guidelines, MIT）。本文を大きく書き換えているため上流には追従しない。frontmatter の `source` / `forked_at` は由来の記録で、LICENSE を同梱し本文冒頭に由来を明記する。上流に取り込む価値のある変更が出ていないかは `skills-review` で点検する。

## sync のタイミング

rulesync は**コマンドを打ったときだけ**動く（自動では走らない）。

- **sync し忘れ**は lefthook の pre-commit フックで防ぐ（`templates/lefthook.yml` の `rulesync-generate` ブロック）。`.rulesync/` や `rulesync.jsonc` をステージしてコミットすると、生成物が再生成されて同じコミットに含まれる。generate はコミット済みの取得物 `.curated/` を読むだけなのでオフラインで数秒
- **上流の更新追従**は自動化しない。下の「更新の追従」の手順で、必要なときに手で上げる
- CI の検査（`doctor --strict` と `--frozen`）は保険として残す。**`doctor` は必ず入れる**——rulesync の設定スキーマは非厳格で、`targets` を `target` と書き間違えても黙って無視されるため、これが唯一の検出手段になる

## templates/ — rulesync の配布対象外のもの

git フック等の設定ファイルは rulesync では配布できない（rulesync が扱うのはエージェント指示のみ）。各リポジトリへ実ファイルをコピーして使う。

- `templates/lefthook.yml` — commit-msg で commitlint、pre-commit で rulesync 自動 sync。任意で textlint。**既存の lefthook.yml があるリポジトリでは上書きせずマージする**
- `templates/commitlint.config.mjs` — `language-and-commits` ルールと対をなす commitlint 設定（commitlint 未導入リポジトリ向け。既存設定があるリポジトリはそちらを正とする）
- `templates/.textlintrc.json` — `japanese-writing` ルールと対をなす textlint 設定。文章が主体のリポジトリで使う。`ai-tech-writing-guideline` は「適切な」のような一般語まで指摘し、severity 指定に関わらずコミットを止めるので既定で無効。箇条書き主体の文書（スキルシート等）では `no-ai-list-formatting` / `no-ai-emphasis-patterns` も切る

導入（消費側リポジトリで）:

```bash
bun add -d lefthook @commitlint/cli @commitlint/config-conventional
cp <このリポ>/templates/lefthook.yml <このリポ>/templates/commitlint.config.mjs .
bunx lefthook install
# 文章が主体のリポジトリなら
bun add -d textlint @textlint-ja/textlint-rule-preset-ai-writing
cp <このリポ>/templates/.textlintrc.json .
```

複数リポジトリへの一斉配布は、組織側で用意した multi-repo 運用の仕組みに任せる。

## 消費側の既知の落とし穴

- **フォーマッタと取得物の衝突**: oxfmt / prettier 等が `.rulesync/`（`.curated/` 含む）や生成物（CLAUDE.md / AGENTS.md / .claude/ / .agents/）を整形すると、`rulesync.lock` の sha256 検証と `generate --check` が崩れる。**フォーマッタの ignore に必ず両方を入れる**

## 更新の追従

**自動追従はしない。** rulesync の `rulesync.lock` は npm / bun の lock と同じ思想で、解決済みの commit SHA とファイルの sha256 を記録して再現性を担保するもの。バージョン範囲の指定という概念がなく、`install --update` を明示的に打たない限り取得内容は動かない。だから追従は「上げたいときに上げる」でよい。

- 消費側は `source` にタグを付けず、`rulesync.lock` をコミットする
- このリポジトリを変更したら main に push するだけでよい。タグは切らない（過去のタグは残っているが、新しく作らない）
- 直したルールを各リポジトリへ反映するのは、その必要が出たとき。忘れても壊れない（lock 固定なので古いまま安定して動く）

消費側 1 リポジトリでの更新:

```bash
rulesync install --update && rulesync generate
git add -A && git commit -m "improve(rulesync): 共有ルールを最新へ追従"
```

複数リポジトリを一度に上げるなら、clone を横断して同じことをするスクリプトを 1 本持つとよい（`git status` が汚れているリポジトリはスキップし、`--dry-run` で lock と上流 HEAD の差だけ先に見られる形にする）。

**追従忘れの受け皿は `skills-review` スキル**。月 1 の棚卸しで、各リポジトリの lock と上流 HEAD の差、外部スキルの更新状況、上位互換の有無をまとめて点検する。
