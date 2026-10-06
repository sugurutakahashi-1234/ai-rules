#!/usr/bin/env bash
# rulesync.lock の各 source が上流（requestedRef）からどれだけ遅れているかを調べ、遅れている source だけ 1 行ずつ出す。
# Claude Code の SessionStart hook から呼ぶ想定（stdout はそのままモデルの文脈に入る）。
# 遅れがなければ何も出さない。gh・jq・ネットワークが使えないときも黙って exit 0 にして、セッションの開始を止めない。
# 対になるルールは rules/rulesync-freshness.md。配置（PATH に置く・settings.json に hook を書く）はマシン設定リポジトリの仕事。
set -u
lock="${1:-rulesync.lock}"
[ -f "$lock" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0
command -v curl >/dev/null 2>&1 || exit 0

token="$(gh auth token 2>/dev/null || true)"
hdr="X-Rulesync-Outdated: 1"
[ -n "$token" ] && hdr="Authorization: Bearer $token"

# ループは関数に置く。macOS 標準の bash 3.2 は `$( ... )` の中の case 文の `)` を正しく読めず、変数が未定義のまま評価される
scan() {
  jq -r '.sources | to_entries[] | [.key, (.value.requestedRef // "main"), (.value.resolvedRef // ""), (.value.resolvedAt // "")] | @tsv' "$lock" 2>/dev/null |
  while IFS=$'\t' read -r src ref sha at; do
    [ -n "$sha" ] || continue
    # base = lock の commit、head = 追っているブランチ。ahead_by が head の進んだコミット数
    ahead="$(curl -sS -m 4 -H "$hdr" -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/$src/compare/$sha...$ref" 2>/dev/null | jq -r '.ahead_by // empty' 2>/dev/null)"
    [[ "$ahead" =~ ^[0-9]+$ ]] || continue
    [ "$ahead" -gt 0 ] || continue
    # 変数は ${} で囲む。bash 3.2 は日本語の全角文字が直後に続くと変数名の区切りを誤る
    echo "rulesync: ${src} は上流（${ref}）より ${ahead} コミット遅れ。lock の取得は ${at:0:10}。上げるなら \`rulesync install --update && rulesync generate\`"
  done
}
out="$(scan)"
[ -n "$out" ] || exit 0
printf '%s\n' "$out" "（上の遅れは、ユーザーへの最初の返答の冒頭で 1 行ずつ伝える。上げるかはユーザーが決める）"
exit 0
