---
name: ai-rules-update
description: 複数のローカルリポジトリに共有ルール・スキル・同梱スクリプトの変更を反映し、rulesync 本体も指定版へ更新する。ai-rules の利用先を探したい、一括で更新・再生成・検証したいときに使う。
---

# ai-rules の一括更新

共有の変更は配布元の正本で一度行い、利用側では取得・生成・検証する。同梱の [scripts/update.ts](scripts/update.ts) が反復処理を担い、AI は対象の選定、変更の影響、例外対応、差分レビューを担う。Bun（`Bun.JSONC.parse` 対応版）と Git が必要。追加の npm 依存はない。

## 更新するものを分ける

| 依頼 | 適用方法 |
|---|---|
| 共有ルール・スキル・スキル内の scripts/references | 配布元の正本を変更し、利用側で `--sources` |
| rulesync 本体 | release notes と移行資料を確認して `--rulesync-version X.Y.Z` |
| コピー済みの templates、CI、リポ固有の実行スクリプト | AI が各リポの既存設定に合わせて変更する。rulesync では配布されない |
| その他の SDK、グローバルスキル、派生スキルの上流追従 | このスクリプトの対象外。各管理元の手順で扱う |

新しい正本を利用側へ取得させるには、配布元の変更が参照先へ push 済みである必要がある。未公開の変更を「反映済み」としない。タグ・ブランチ・SHA 固定の source はその指定を尊重し、勝手に外さない。

`--sources` は選択したプロジェクトの **全 sources** を再解決する。ai-rules だけに絞るオプションではない。他の source の更新が依頼範囲外なら一括適用せず、そのプロジェクトは個別に扱う。

## 対象を探す

以下の `SKILL_DIR` は、この SKILL.md がある実際のディレクトリの絶対パスに置き換える。利用側のカレントディレクトリから `scripts/update.ts` を探さない。

```bash
bun "$SKILL_DIR/scripts/update.ts" list --root /path/to/repos
```

`--root` は複数指定できる。JSON 出力には設定の場所、Git ルート、remote、作業中の差分、sources と lock の参照、rulesync の指定版が載る。読み取り専用のローカル棚卸しで、上流との差を調べた結果ではない。必要なら lock の `resolvedRef` と該当 source の参照先を突合する。

探索範囲はユーザーの指定と既存のリポ台帳から決める。発見した全リポが更新対象とは限らない。アーカイブ済み・運用停止・別名 clone・別 worktree を区別し、同じリポの更新先は一つにする。対象ごとの AGENTS.md、rulesync 設定、package.json の scripts を読み、今回の実行範囲を確認する。

## 計画と適用

```bash
# 計画のみ。リポへの書き込み・依存取得は行わない
bun "$SKILL_DIR/scripts/update.ts" update --project /path/to/repo-a --project /path/to/repo-b --sources

# 同じ指定に --apply を付けて取得・生成・検証
bun "$SKILL_DIR/scripts/update.ts" update --project /path/to/repo-a --project /path/to/repo-b --sources --apply

# 本体だけを指定した安定版へ更新。--sources と同時指定も可能
bun "$SKILL_DIR/scripts/update.ts" update --project /path/to/repo-a --rulesync-version 19.0.0 --apply
```

同じ依頼の中で更新が承認されていれば、計画を確認した後そのまま適用する。調査だけの依頼では `--apply` を付けない。

自動適用は Git ルート直下に rulesync.jsonc、Bun lockfile、rulesync の直接依存、`rulesync` / `rulesync:check` scripts がある構成に対応する。モノレポ、ローカル設定の上書き、別パッケージマネージャーなどは理由付きで `blocked` にする。AI が既存の実行経路を確認して個別対応し、一括処理の都合で構成を変えない。認証は既存の環境を使い、token を引数やレポートに書かない。

適用時は作業ツリーの変更・重複 worktree を検査し、Bun の lifecycle scripts を実行せず依存を準備する。本体更新がある場合は先に行い、その後 sources 更新、既存の生成・検証 scripts、strict doctor、生成一致・差分検査を実行する。生成・検証 scripts 自体は実行されるので、コミットや配布など別の副作用が含まれるものは自動適用しない。

失敗したリポは差分を残して停止し、他の対象は続行する。自動 stash・reset・復元はしない。再実行で dirty を回避するために差分を消さず、AI が失敗段階と差分を確認して続きを行う。`resolvedAt` だけの変更も勝手に戻さず、出力の `timestampOnly` で区別する。

## レビューと完了

出力はプロジェクトごとの `planned` / `updated` / `unchanged` / `blocked` / `failed` と、実行コマンド・変更パス・失敗理由。blocked/failed があれば終了コードは 1。成功した対象と保留を分けて報告し、残った未追跡ファイルも確認する。

利用側の lock に記録された `resolvedRef` が意図した配布元の変更を含むことを確認する。一括実行中に上流が動くこともあるので、全対象が同じ内容を取得したと決めつけない。

rulesync のメジャー更新では生成物の振る舞いをレビューする。特に permissions の読み書き範囲、スキルの自動起動設定、削除・配置変更はチェック成功だけで判断しない。追加の検証は各リポの指示に従う。

スクリプトは Git の add / commit / push を行わない。これらも依頼されている場合は、AI が差分をレビューしてから対象ファイルを選び、リポごとに実施する。更新成功と push 成功を区別し、公開を確認できなかったものを再送・完了扱いしない。
