# ai-rules

個人（sugurutakahashi-1234）の **汎用 AI コーディングエージェント向けルール・スキルの正本**。
[rulesync](https://github.com/dyoshikawa/rulesync) の宣言的ソースとして、業務・個人を問わず各リポジトリから取り込む。

会社・案件固有のルールはここには置かない。所属組織ごとのルールリポジトリに置き、消費側の `rulesync.jsonc` で両方を `sources` に並べる。

**これはメニューであって、強制ではない。** 「全リポジトリが従うべき規格」ではなく、**各リポジトリが必要なものだけ選んで取り込む品揃え**。選ぶのは消費側。

**取り込まない選択もある。** 触る人が限られていて外部依存を減らしたいリポジトリでは、`sources` を使わず `.rulesync/` の正本だけで完結させてよい（rulesync は生成器としてそのまま使える）。必要な規約はそのリポジトリに直接書く。

## ルール

| ルール | globs | 内容 |
|---|---|---|
| `git-safety` | なし（常時） | 取り消せない・他人に見える git 操作の境界。確実に止めるなら `templates/claude-settings.json` と併用 |
| `secret-safety` | なし（常時） | シークレット検知で止まったときの作法（回避せず値を無効化する） |
| `language-and-commits` | なし（常時） | 日本語の使い分けとコミット規約（type 英語・subject 日本語） |
| `code-conventions` | `**/*` | コーディング規約（変更の範囲を広げない・コメントは WHY のみ・UTC/JST 等） |
| `japanese-writing` | `**/*.md` | 日本語の文体規範。AI 生成文に出やすい癖（空虚な形容・予告・対句・翻訳調）の禁止 |
| `github-actions` | `.github/workflows/**` | ワークフローの制約（SHA ピン・skip の扱い・デプロイのゲート） |
| `dependency-hygiene` | なし（常時） | 依存の扱い（公開直後を避ける・更新 bot の判断・直せない脆弱性） |
| `skill-layering` | スキル関連 | スキル・ルールの置き場所判断と、今のモデル向けの書き方（強調語を使わない・理由を書く・ハーネスと重ねない） |
| `browser-tooling` | なし（常時） | ブラウザ作業の道具の選び方（ログインが要る操作はユーザーの Chrome、自サイトの検証は内蔵ブラウザ、外部 Playwright MCP は使わない） |
| `output-style` | なし（常時） | 回答の形。結論と次の行動を先に、手順は番号付き、一覧は 5 項目まで、前置き・締めの挨拶なし（ayghri/i-have-adhd 由来） |
| `voice-input` | なし（常時） | 音声入力のプロンプトの読み方（誤変換を字面どおりに受け取らず、文脈から意図を解釈する） |
| `rulesync-freshness` | なし（常時） | 取り込んだルール・スキルの遅れに気づく（Claude Code は SessionStart hook `templates/hooks/rulesync-outdated.sh`、他は lock の取得日で判断し、最初の返答で 1 行知らせる） |

`globs` 付きのルールは、該当ファイルを読み書きするまで読み込まれない。常時効かせたいものには `globs` を書かない。

ルールもスキルも 2026-09 時点のモデル（Claude Opus 5.5 / Fable 5.1、GPT-6 Astra）向けに書いている。目的と境界と落とし穴を書き、段取りは書かない。`CRITICAL` / 「必ず」のような強調語は使わず、理由を添える。ハーネスとモデルが既に持つ振る舞い（検証・テスト実行・進捗報告）は重ねない。前世代向けに足した足場が残っていないかは `skills-review` で棚卸しする。方針の正本は `skill-layering` ルールの「書き方」節。

## スキル

| スキル | 内容 | 備考 |
|---|---|---|
| `design-compare` | デザイン案・構成案・文言案の比較モック、レビュー指摘の選択票、点検で見つけた問題の報告、一括適用後の変更履歴ビューを 1 枚の HTML にして判断してもらう | `assets/` に雛形 4 つ同梱 |
| `image-gen` | Codex 経由 gpt-image-2 の呼び出し規約・並列一括生成 | `scripts/parallel-imggen.sh` 同梱 |
| `md-infographic` | 章扉インフォグラフィックのスタイル定型 | **前提: `image-gen` も併せて導入** |
| `github-issue-infographic` | GitHub issue へのインフォグラフィック差し込み | **前提: `image-gen` も併せて導入** |
| `md-to-pdf` | Markdown→PDF の 2 段変換手順 | |
| `drawio-diagram` | draw.io 図の作成・書き出し・自己チェック | agents/references/scripts 同梱 |
| `skills-review` | 導入済みスキルの棚卸し・追従の遅れ・上位互換の探索・提案表 | 月 1 の定期点検用。`scripts/inventory.sh` 同梱 |
| `ai-rules-update` | 複数リポへの共有ルール・スキル・同梱スクリプトの反映、rulesync 本体の指定版更新 | 一覧・計画・適用のスクリプト同梱。差分を未コミットで残す |
| `ai-rules-setup` | リポジトリの目的と構成を読んで、ここから何を選ぶか（rules / skills / templates / 会社層）を理由付きの表で提案し、承認後に書き込んで install / generate / check まで行う | 新しいリポジトリに入れる・既存リポジトリに足すときの入口。rulesync が無い場所で使うのでグローバル導入が前提 |

**派生（外部由来を改変して所有）**: `accessibility` / `core-web-vitals` / `web-quality-audit`（由来: addyosmani/web-quality-skills, MIT）、`seo-audit` / `ai-seo` / `schema` / `cro`（由来: coreyhaines31/marketingskills, MIT）、`web-design-guidelines`（由来: vercel-labs/web-interface-guidelines, MIT）。本文を大きく書き換えているため上流には追従しない。frontmatter の `source` / `forked_at` は由来の記録で、LICENSE を同梱し本文冒頭に由来を明記する。取り込む価値のある変更が上流に出ていないかは `skills-review` で点検する。

**他人のスキルはここにコピーしない。** 消費側の `sources` に上流リポを直接書き、追従は rulesync に任せる。本文に手を入れたくなったら、コピーして上の「派生」として所有する。中途半端に「コピーして少し直した」状態を残さない。

```jsonc
{ "source": "coji/natural-japanese", "skills": ["natural-japanese"] }
```

### よく使う外部 source

ここから配るものではないが、消費側の `sources` に並べる候補としてよく出てくるもの。該当する技術を使うリポジトリだけが選ぶ。lock 固定と一括更新（`ai-rules-update --sources`）はここのスキルと同じに効く。

| スキル | 上流 | 選ぶリポジトリ | ライセンス |
|---|---|---|---|
| `natural-japanese` | coji/natural-japanese | 日本語の文章を書くリポジトリ | MIT |
| `workers-best-practices` | cloudflare/skills | Cloudflare Workers を使うリポジトリ（`wrangler.toml` / `wrangler.jsonc` がある）。Workers の API・設定の現在の推奨を補う。リポジトリ側で意図的に外している推奨（`nodejs_compat` を入れない等）は、そのリポジトリのルールに 1 行書けばそちらが勝つ | Apache-2.0 |

```jsonc
{ "source": "cloudflare/skills", "skills": ["workers-best-practices"] }
```

## 使い方

各リポジトリの `rulesync.jsonc` に `sources` を書く。参照にタグは付けず、デフォルトブランチを追う。固定は `rulesync.lock`（commit SHA と sha256）が担う。

何を選ぶかは [ai-rules-setup](skills/ai-rules-setup/SKILL.md) が、リポジトリの目的と構成（言語・workflows・lockfile・文書の量・GitHub org）から表で提案する。手で選ぶなら下の例から始める。

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

- `rulesync install` は lock 通りに取得する（初回は HEAD を解決して lock に書く）。`rules` / `skills` の選定を広げた分は `install` だけで取得される（lock の ref にある範囲。上流に push したばかりのものは lock の ref に無いので黙って取得されない。`--update` で ref を進める）。広げたまま `install` していない状態は `--frozen` が検出する（rulesync 16.28.0 以上。それより前は選定を広げても `install` が黙って無視し、`--frozen` も通ってしまった）
- 戻したいときは lock を revert する。タグは切らない

呼び出しは `package.json` の scripts に置く。**名前はこの 2 つで揃える**（CI・lefthook・スキル本文から参照されるため、リポジトリごとに変えない）。中身が複数コマンドの合成なので、`generate` や `doctor` のような個別コマンド名は使わない——検査を足したときに名前が嘘になる。

```jsonc
"scripts": {
  "rulesync": "bunx rulesync install && bunx rulesync generate",
  "rulesync:check": "bunx rulesync doctor --strict && bunx rulesync install --frozen && bunx rulesync generate --check"
}
```

- `rulesync:check` は 3 段。`doctor` が設定の書き間違いを、あとの 2 つが lock との乖離を検出する。**`doctor` は必ず入れる**（rulesync の設定スキーマは非厳格で、`targets` を `target` と書き間違えても黙って無視されるため、これが唯一の検出手段）
- **rulesync 本体は `package.json` の devDependency に入れる**（`bun.lock` が版を固定し、上げるときは `bun update rulesync`）。mise の `[tools]` に `"npm:rulesync"` を書かない——npm パッケージを 2 か所で管理することになり、`latest` 指定だと実行のたびに版が変わって再現性も失う。mise が持つのは言語ランタイムと単体の CLI（bun, node, uv, gh, lefthook など）だけ
- mise を使うリポジトリは `[tasks.rulesync]` / `[tasks."rulesync:check"]` を置き、**中身は `bun run rulesync` を呼ぶだけにする**。両方に実体を書くと片方を直したときにずれる（mise はタスク名にコロンを使えるので表記も揃う）
- 生成物をコミットしない構成でなければ、`rulesync:check` を CI に入れる

**罠が 2 つある。**

- `"skills": []` と書いてはいけない（「skills を選択したが 0 件一致」と解釈されて install が失敗する）。`rules` と `skills` を両方省略すると全 skills が取得されるので、`rules` は必ず明示する
- フォーマッタが `.rulesync/`（`.curated/` 含む）や生成物（CLAUDE.md / AGENTS.md / .claude/ / .agents/）を整形すると lock の sha256 検証が崩れる。**oxfmt / prettier の ignore に両方を入れる**

## 更新の追従

**自動追従はしない。** `rulesync.lock` は npm / bun の lock と同じ思想で、バージョン範囲という概念がなく、`install --update` を打たない限り取得内容は動かない。追従は「上げたいときに上げる」でよく、忘れても lock 固定で古いまま安定して動く。

```bash
rulesync install --update && rulesync generate
```

- このリポジトリを変更したら main に push するだけでよい。タグは切らない
- 複数リポジトリを一度に上げるなら、更新を管理するリポの `sources` に `skills: ["ai-rules-update"]` を追加する。[ai-rules-update](skills/ai-rules-update/SKILL.md) が対象の一覧確認と一括取得・生成・検証を担い、AI が差分レビューと個別対応を行う。配布元の変更は push 後に取得する。スクリプトは dirty なリポを除外し、コミット・push は行わない。既存の組織別一括更新がある場合は対象台帳を活かし、同じリポに両方を重ねて実行しない
- rulesync はリポジトリの境界で止まる設計で、この横断は利用側が持つ。定期実行の CI で `install --update` して PR を開くのも正当な使い方
- `install --update` は取得内容が変わらなくても lock の `resolvedAt` を書き換える。「変更があったか」は `git diff --quiet -I '"resolvedAt"' -- rulesync.lock` のように `resolvedAt` を除いて見る（Git 2.30 以上）
- lock が上流からどれだけ遅れているかを読み取り専用で出す公式コマンドはまだない。lock の `resolvedRef` と上流 HEAD を自分で突合する（上流 issue [#2983](https://github.com/dyoshikawa/rulesync/issues/2983) で提案中）
- この節の運用は rulesync 公式 FAQ の [How do I keep many repositories in sync with a shared source?](https://rulesync.dyoshikawa.com/faq#how-do-i-keep-many-repositories-in-sync-with-a-shared-source) と同じ
- 追従忘れの受け皿は `skills-review` スキル。月 1 の棚卸しで、lock の遅れ・外部スキルの更新・上位互換をまとめて点検する
- **sync し忘れ**は別問題で、lefthook の pre-commit（`templates/lefthook.yml`）が防ぐ。`.rulesync/` や `rulesync.jsonc` をステージすると生成物が再生成されて同じコミットに入る

一括更新をよく使うリポでは、導入済みスキルを scripts から呼べる。以下は `codexcli` 向けの生成先を使う例（Claude Code のみなら `.claude/skills/` に読み替える）。

```jsonc
"scripts": {
  "rulesync:list": "bun .agents/skills/ai-rules-update/scripts/update.ts list",
  "rulesync:update": "bun .agents/skills/ai-rules-update/scripts/update.ts update"
}
```

`bun run rulesync:list --root /path/to/repos` で棚卸しし、`bun run rulesync:update --project /path/to/repo --sources` で計画を見る。実行は `--apply` を追加する。`--sources` はそのプロジェクトの全 sources を更新する。本体の指定版更新は `--rulesync-version X.Y.Z`。対応構成と個別対応が必要な場合はスキル本文を参照。

## templates/ — rulesync では配布できないもの

git フック等の設定ファイルは rulesync の管轄外（rulesync が扱うのはエージェント指示のみ）。各リポジトリへ実ファイルをコピーして使う。

- `templates/lefthook.yml` — commit-msg で commitlint、pre-commit で rulesync 自動 sync。任意で textlint。**既存の lefthook.yml があるリポジトリでは上書きせずマージする**
- `templates/commitlint.config.ts` — `language-and-commits` ルールと対をなす commitlint 設定（既存設定があるリポジトリはそちらを正とする）
- `templates/.textlintrc.json` — `japanese-writing` ルールと対をなす textlint 設定（どのルールを切るかはファイル内のコメント参照）
- `templates/claude-settings.json` — `git-safety` ルールと対をなす Claude Code の permissions（破壊的操作の `deny` のみ。push は確認を挟まない）。ルールは文脈であって強制ではないので、破壊的な git 操作を確実に止めたいリポジトリでは `.claude/settings.json` にマージする。`deny` はどの permission mode でも効く。コマンド前置パターンは `git -C . push` のような別形を拾えないので、それも塞ぐなら `PreToolUse` hook を足す
- `templates/hooks/rulesync-outdated.sh` — `rulesync-freshness` ルールと対をなす SessionStart hook。cwd の `rulesync.lock` の各 source を GitHub の compare API で上流と比べ、遅れている source だけ 1 行ずつ出す（遅れがなければ無言。gh・jq・ネットワークが無ければ黙って終わる）。マシンの PATH（例: `~/.local/bin`）に置き、`~/.claude/settings.json` の `hooks.SessionStart` から呼ぶ。配置はマシン設定リポジトリ（mac-setup）の仕事

```bash
bun add -d lefthook @commitlint/cli @commitlint/config-conventional @commitlint/types
cp <このリポ>/templates/lefthook.yml <このリポ>/templates/commitlint.config.ts .
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
