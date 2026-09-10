---
name: skills-review
description: >
  導入済みのスキル・ルールを棚卸しし、追従の遅れ・上流の生存確認・上位互換の探索をして、継続・乗り換え・削除の提案表を作るスキル。
  グローバル導入（skills CLI）、rulesync の sources、派生して所有しているスキルのすべてが対象。
  Use when 「スキルを点検して」「スキルの棚卸し」「上位互換がないか探して」「古くなったスキルはないか」「ルールの追従が遅れていないか」と言われたとき、
  または月に一度の定期点検として。
---

# skills-review（スキルの定期点検）

> **Core Principle**: 判断は人がする。このスキルは材料（現状・上流の状態・代替候補）を一枚の表に揃えるところまでを担い、削除や乗り換えを勝手に実行しない。

## 対象

導入経路は 3 つあり、すべてを一度に棚卸しする。

| 経路 | 台帳 | 追従 |
|---|---|---|
| グローバル（skills CLI） | `~/.agents/.skill-lock.json` | `npx -y skills@latest update -g` |
| rulesync の sources | 作業中リポの `rulesync.jsonc` と `rulesync.lock` | `rulesync install --update` |
| 派生して所有（frontmatter に `source` と `forked_at`） | 各 SKILL.md の frontmatter | 追従しない。上流との差と代替を点検する |

## 手順

### 1. 棚卸し

`bash scripts/inventory.sh` を作業中のリポで実行する。3 経路を走査して、スキル名・経路・上流リポ・固定している commit / hash を TSV で出す。rulesync.jsonc が無いリポでは、グローバルと派生だけが対象になる。

### 2. 追従の遅れを見る

rulesync は lock で固定され自動追従しないので、放っておくと消費側は古いまま安定して動き続ける。壊れはしないが、直したルールが効いていない状態になる。ここでその遅れを可視化する。

- 作業中リポの `rulesync.lock` の `resolvedRef` と、各 source の上流 HEAD（`gh api repos/<owner>/<repo>/commits/HEAD --jq .sha`）を突合する
- 差があれば、その間に何が入ったかを `gh api repos/<owner>/<repo>/compare/<lockのSHA>...HEAD --jq '.commits[].commit.message'` で 1 行ずつ見て要約する
- 複数リポを横断する一括更新スクリプトがある環境では、その `--dry-run` に任せてよい
- 上げると決めたら `rulesync install --update && rulesync generate`。lock の差分を確認してからコミットする

### 3. 上流の生存確認

棚卸しで出た上流リポごとに `gh api repos/<owner>/<repo>` で次を取り、表に足す。

- 最終 push 日（`pushed_at`）。180 日以上更新が無ければ「停滞」と印を付ける
- archived かどうか
- star 数と license
- 固定している commit から HEAD までのコミット数（`gh api repos/<owner>/<repo>/compare/<sha>...HEAD --jq .total_commits`）

派生スキルは、上流の HEAD と `forked_at` の差分を見て、取り込む価値のある変更（新しい検査項目・前提の更新）があるかを短く要約する。

### 4. 代替の探索

スキルごとに WebSearch で代替候補を探す。検索語は「<スキルの目的> skill SKILL.md」「<目的> Claude Code スキル」「<目的> agent skill github」の 3 系統を英語と日本語で試す。候補は次の基準で比較し、現行より明確に良いものだけを挙げる。

- 更新が続いている（直近 90 日にコミットがある）
- star 数が現行と同等以上、または作者が当該分野の実務者である
- license が明示されている（MIT / Apache-2.0 / Unlicense など）
- 日本語の文書が対象なら日本語固有のパターンを扱っている
- 同梱スクリプトの依存（Python・形態素解析器など）が導入コストに見合う

候補が無ければ「候補なし」と書く。探索の精度は高くないので、候補を並べるまでにとどめ、乗り換えの判断は使う人に委ねる。

### 5. 提案表

次の列で 1 つの表にまとめて提示する。

| スキル | 経路 | 上流の状態 | 代替候補 | 推奨 | 根拠 |
|---|---|---|---|---|---|

推奨は「継続」「更新して継続」「乗り換え」「削除」の 4 値。根拠は一文。派生スキルで上流に取り込む価値のある変更があれば「更新して継続」とし、差分の要点を根拠に書く。

### 6. 追従の実行（合意後）

使う人が表を見て決めたものだけを実行する。

- グローバル: `npx -y skills@latest update -g -y`
- rulesync: `rulesync install --update && rulesync generate`。lock の差分を確認してからコミットする
- 派生: 上流の該当変更を手で取り込み、`forked_at` を更新する
- 乗り換え・削除: 台帳（skills CLI のインストールコマンド、rulesync.jsonc の選定、派生スキルのディレクトリ）から外し、消費側の参照も更新する

## 出力の置き場

提案表は会話に出すだけでよい。ファイルに残すときは作業中リポの `docs/` に日付付きで置き、実行後は消す。台帳やスキル本文に点検ログを書き足さない（時系列ログは腐る）。
