#!/usr/bin/env bash
# 導入済みスキルの棚卸し。3 経路（skills CLI グローバル / rulesync sources / 派生所有）を
# 走査して TSV を出す。作業中のリポのルートで実行する。
# 出力列: name  route  upstream  pinned  note
set -euo pipefail

printf 'name\troute\tupstream\tpinned\tnote\n'

# 1. skills CLI（グローバル）
lock="$HOME/.agents/.skill-lock.json"
if [ -f "$lock" ] && command -v jq >/dev/null; then
  jq -r '.skills | to_entries[] | [.key, "global", .value.source, .value.skillFolderHash, ("updated " + (.value.updatedAt // "" | .[0:10]))] | @tsv' "$lock"
fi

# 2. rulesync sources（作業中リポ）
if [ -f rulesync.lock ] && command -v jq >/dev/null; then
  jq -r '
    .sources | to_entries[] |
    .key as $src | .value as $v |
    ((($v.skills // {}) | keys) | map([., "rulesync-skill", $src, ($v.resolvedRef | .[0:12]), ("ref " + ($v.requestedRef // "default"))]))
    + ((($v.resolvedRuleNames // []) ) | map([., "rulesync-rule", $src, ($v.resolvedRef | .[0:12]), ("ref " + ($v.requestedRef // "default"))]))
    | .[] | @tsv' rulesync.lock
fi

# 3. 派生所有（frontmatter に source を持つ SKILL.md）
find . -path ./node_modules -prune -o -name SKILL.md -print 2>/dev/null | while read -r f; do
  src=$(awk '/^---$/{c++; next} c==1 && /^[[:space:]]*source:/{print $2; exit}' "$f")
  [ -n "$src" ] || continue
  forked=$(awk '/^---$/{c++; next} c==1 && /^[[:space:]]*(forked_at|revision):/{print $2; exit}' "$f")
  name=$(awk '/^---$/{c++; next} c==1 && /^name:/{print $2; exit}' "$f")
  printf '%s\tderived\t%s\t%s\t%s\n' "${name:-$(basename "$(dirname "$f")")}" "$src" "${forked:-—}" "$f"
done
