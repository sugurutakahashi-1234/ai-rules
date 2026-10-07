---
name: ai-rules-setup
description: リポジトリに ai-rules（rulesync の sources）を入れる・増やすときに、そのリポの目的と構成を読んでルール・スキル・templates の選択を 1 枚の表で提案し、承認されたら書き込んで install / generate / check まで行う。「ai-rules を入れて」「rulesync をセットアップして」「このリポに合うルール・スキルを選んで」「スキルを足したい」と言われたとき、新しいリポジトリを作った直後に使う。
---

# ai-rules のセットアップ（選択の提案と導入）

ai-rules はメニューで、何を取るかは消費側が決める。このスキルは「このリポジトリなら何を選ぶか」を理由付きの表 1 枚で提案し、承認されたら書き込む。選ばなかったものにも理由を書く（後から足す・外す判断ができるように）。ai-rules 自身のリポジトリでは使わない（自分を sources に書くと循環する）。

## 聞く前に読むもの

目的を聞くのは 1 問だけにし、残りはリポジトリから読む。

- `git remote` の org。`ZENSHIN-Inc` なら会社層 `ZENSHIN-Inc/zenshin-ai-rules` も `sources` に並べ、その README の選択目安に従う（会社固有の中身はそちらが正本）
- README・`package.json`・言語とフレームワーク。アプリ / ライブラリ / インフラ（IaC）/ 文書・記事 / 業務ツールのどれか
- `.github/workflows/` の有無、lockfile の有無、`docs/` や記事ファイルの量、公開 Web サイトかどうか
- 既存の `rulesync.jsonc`・`lefthook.yml`・`commitlint.config.*`・`.textlintrc.json`・`.claude/settings.json`・フォーマッタの ignore。あるものは上書きせずマージする
- 読んでも目的が決まらないときだけ、「このリポジトリは何のため？（アプリ / ライブラリ / インフラ / 文書・記事 / 業務ツール）」と 1 問聞く

## 選択の目安

| 対象 | 入れる条件 | 理由 |
|---|---|---|
| `language-and-commits` `git-safety` `secret-safety` | 常に | 言語・コミット規約と、取り消せない操作の境界。どのリポジトリでも効く |
| `code-conventions` | コードがある（アプリ / ライブラリ / ツール / IaC） | 文書だけのリポジトリには当たる場面がない |
| `japanese-writing` | README 以外に日本語の文書・記事がある | 文章が主体でなければ `**/*.md` の globs でほぼ読まれず、入れても害は小さいが選ぶ意味も薄い |
| `github-actions` | `.github/workflows/` がある | |
| `dependency-hygiene` | lockfile がある（依存を持つ） | |
| `browser-tooling` | Web フロント・E2E・サイトの検証をする | |
| `skill-layering` | そのリポジトリで `.rulesync/skills/` や rules を書く予定がある | ルール・スキルの置き場所と書き方の判断。書かないリポジトリには不要 |
| `output-style` `voice-input` `rulesync-freshness` | 入れない | 個人の好みと環境の話なので、グローバル（マシン設定）で持つ。同僚のいるリポジトリに配らない |
| `design-compare` | ほぼ常に | 文言・見た目・構成の判断を HTML で見せる型。コードのリポジトリでも UI や README の判断で使う |
| `image-gen` + `md-infographic` / `github-issue-infographic` | 文書・記事・issue で図解を作る | `image-gen` が前提。後の 2 つだけ入れない |
| `drawio-diagram` | 設計文書・構成図を書く | |
| `md-to-pdf` | 配布する文書を作る（提案書・スキルシート） | |
| `web-quality-audit` `accessibility` `core-web-vitals` `web-design-guidelines` | 公開 Web サイト・フロント | 派生スキル群。サイトでなければ発火場面がない |
| `seo-audit` `ai-seo` `schema` `cro` | 集客する公開サイト | 社内ツールには不要 |
| `ai-rules-update` | 複数リポジトリの ai-rules を束ねて上げるリポジトリ（マシン設定リポジトリなど 1 か所） | |
| `skills-review` | 点検を回すリポジトリ（1 か所） | モデルを変えたとき・hook が遅れを出したときの棚卸し。方々に入れると台帳が割れる |

templates は rulesync で配れないので実ファイルをコピーする。

| templates | 入れる条件 |
|---|---|
| `lefthook.yml` + `commitlint.config.ts` | 常に（`language-and-commits` と対）。既存の lefthook.yml はマージ |
| `.textlintrc.json` | `japanese-writing` を入れたとき |
| `claude-settings.json` の `permissions.deny` | 常に `.claude/settings.json` にマージ（`git-safety` と対。ルールは文脈で、止めるのは設定） |
| `hooks/rulesync-outdated.sh` | 入れない（マシン側に置くもの。マシン設定リポジトリが配置する） |

## 書き込むもの

- `rulesync.jsonc`: `targets` は `claudecode` と `codexcli`、`features` は `rules` と `skills`、`delete: true`。source ごとに `rules` と `skills` を名前で明示する。`rules` を省くと全 skills が取得され、`"skills": []` は「0 件一致」で install が失敗する
- `features` に `mcp` を足すのは MCP サーバーを使うリポ。`.rulesync/mcp.jsonc` を正本にすると `.mcp.json`（Claude Code）と `.codex/config.toml` の `[mcp_servers.*]`（Codex）が生成されるので、接続先を 2 か所に手書きしない
- `features` に `permissions` を足すと `.rulesync/permissions.jsonc` から `.claude/settings.json` と `.codex/config.toml` の両方が出る（templates/claude-settings.json を手でマージする代わり）。ただし MCP ツールの allow は Codex に渡らない（Codex 向けは read/edit/write/webfetch だけ）ので、`mcp.jsonc` の `codexcli.mcpServers.<name>.default_tools_approval_mode`（`writes` = 読み取り専用と宣言されたツール以外は都度確認）で代替する
- Codex のツール単位の `tools.<name>.approval_mode` は rulesync の予約キー `tools`（配列）と衝突して `mcp.jsonc` に書けない。サーバー単位の既定までで止める
- `package.json`: `rulesync` / `rulesync:check` の 2 script（名前はこの 2 つで固定。CI・lefthook・スキルから参照される）、devDependency に `rulesync` `lefthook` `@commitlint/cli` `@commitlint/config-conventional` `@commitlint/types`（文章主体なら `textlint` `@textlint-ja/textlint-rule-preset-ai-writing` も）。`bun add -d` で入れ、mise の `[tools]` に `npm:rulesync` を書かない
- フォーマッタの ignore に `.rulesync/`（`.curated/` 含む）と生成物（`CLAUDE.md` `AGENTS.md` `.claude/` `.agents/`）を足す。整形されると lock の sha256 検証が崩れる
- 書き込んだら `bun run rulesync` と `bun run rulesync:check` を回す。選定を広げただけなら `install` で足りるが、上流に push したばかりのものは lock の ref に無く黙って取得されないので `rulesync install --update`
- 詳しい前提と罠は ai-rules の README「使い方」が正本。ここに書いていない判断はそちらを読む

## 進め方

1. 読み取った構成と、選ぶ・選ばないの表を 1 回で出す（入れないものにも理由を付ける。会社層がある場合はその分も同じ表に）
2. 承認を 1 回取る。表の行をユーザーが直したら、直した方を正とする
3. 書き込み、install / generate / check を回す。結果は「入れたもの・生成されたファイル・次にやること」の 3 行。コミットはユーザーの指示を待つ
4. 既存リポジトリへの追加なら、差分は増やした分だけにする。既存の選択を外す提案は別の依頼として分ける
