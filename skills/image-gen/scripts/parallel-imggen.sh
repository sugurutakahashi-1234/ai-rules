#!/bin/zsh
# 複数章のインフォグラフィックを codex exec（組み込み image_gen / gpt-image-2）で並列一括生成する。
#
# 使い方:
#   1. ジョブルート（例 /tmp/imggen-<slug>）配下に章ごとの job-<NN>/ を作り、
#      各 job-<NN>/prompt.txt にプロンプト全文（スタイル定型＋描く内容）を置く
#   2. zsh parallel-imggen.sh <ジョブルート> を run_in_background: true で実行
#   3. 成功ジョブは job-<NN>/out.png に画像が確定する。
#      out.png がないジョブは job-<NN>/log.txt を見て個別に再実行する（全部やり直さない）
#
# 環境変数:
#   MAX_PARALLEL    = 同時実行数（default 4。レート制限エラーが出なければ上げてよい）
#   MAX_ATTEMPTS    = 1ジョブあたりの最大試行回数（default 3）
#   ATTEMPT_TIMEOUT = 1試行の上限秒数（default 480。通常生成は150〜240秒）
#   STALL_SECS      = "ERROR: Reconnecting" 出現後、ログ更新なしで打ち切るまでの秒数（default 90）
#
# 章↔画像の対応は「ジョブ専用ディレクトリ + --output-last-message」で決定的に取る。
# 「実行前後の最新ファイル差分」方式は並列だと混線するため使わない。
#
# 停滞対策: OpenAI 側が不安定だと codex exec が "ERROR: Reconnecting... N/5" のまま
# 何十分もハングする（放置では回復しないことが多い）。各ジョブにウォッチドッグを付け、
# 停滞・タイムアウト・画像なし終了（AuthorizationRequired 等の即死を含む）を検知したら
# kill して同条件で自動リトライする。
set -u
setopt NO_NOMATCH  # 未マッチのglobをエラーで中断せずbash同様に扱う（フォールバックのls用）
ROOT=${1:?usage: parallel-imggen.sh <jobs-root>}
MAX_PARALLEL=${MAX_PARALLEL:-4}
MAX_ATTEMPTS=${MAX_ATTEMPTS:-3}
ATTEMPT_TIMEOUT=${ATTEMPT_TIMEOUT:-480}
STALL_SECS=${STALL_SECS:-90}

# 最終メッセージに画像パスを出力させる（保存・リネームの指示ではないので重複保存は起きない）
SUFFIX='
生成が完了したら、最後のメッセージとして生成した画像ファイルの絶対パスのみを1行で出力してください。'

# 1試行: codex exec を起動し、停滞・タイムアウトを監視。正常終了で0、打ち切りで1を返す
run_attempt() {
  local dir=$1
  local prompt pid elapsed age
  prompt="$(cat "$dir/prompt.txt")$SUFFIX"
  codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check \
    --cd "$dir" -o "$dir/last.txt" "$prompt" < /dev/null >> "$dir/log.txt" 2>&1 &
  pid=$!
  elapsed=0
  while kill -0 "$pid" 2>/dev/null; do
    sleep 10
    elapsed=$((elapsed + 10))
    if [ "$elapsed" -ge "$ATTEMPT_TIMEOUT" ]; then
      kill "$pid" 2>/dev/null
      echo "[watchdog] ${ATTEMPT_TIMEOUT}秒超過で打ち切り" >> "$dir/log.txt"
      return 1
    fi
    if grep -q "ERROR: Reconnecting" "$dir/log.txt" 2>/dev/null; then
      age=$(( $(date +%s) - $(stat -f %m "$dir/log.txt") ))
      if [ "$age" -gt "$STALL_SECS" ]; then
        kill "$pid" 2>/dev/null
        echo "[watchdog] Reconnecting後${age}秒ログ更新なし→停滞と判定し打ち切り" >> "$dir/log.txt"
        return 1
      fi
    fi
  done
  return 0
}

run_job() {
  local dir=$1
  local attempt png
  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "--- attempt ${attempt} $(date '+%H:%M:%S') ---" >> "$dir/log.txt"
    rm -f "$dir/last.txt"
    if ! run_attempt "$dir"; then
      echo "RETRY $dir (attempt ${attempt}: 停滞/タイムアウト)"
      continue
    fi
    png=$(grep -oE '/[^[:space:]]+\.png' "$dir/last.txt" 2>/dev/null | tail -1)
    if [ -n "$png" ] && [ -f "$png" ]; then
      cp "$png" "$dir/out.png"
      echo "OK    $dir (attempt ${attempt})"
      return
    fi
    # フォールバック: codex が --cd 配下に独自名で保存した PNG を拾う
    png=$(ls -t "$dir"/*.png 2>/dev/null | grep -v '/out\.png$' | head -1)
    if [ -n "$png" ]; then
      cp "$png" "$dir/out.png"
      echo "OK(fb) $dir (attempt ${attempt})"
      return
    fi
    echo "RETRY $dir (attempt ${attempt}: 終了したが画像なし)"
  done
  echo "FAIL  $dir (${MAX_ATTEMPTS}回失敗。log: $dir/log.txt)"
}

active=0
for dir in "$ROOT"/job-*/; do
  [ -f "${dir%/}/prompt.txt" ] || continue
  run_job "${dir%/}" &
  active=$((active + 1))
  if [ "$active" -ge "$MAX_PARALLEL" ]; then
    wait
    active=0
  fi
done
wait

echo "--- summary ---"
for dir in "$ROOT"/job-*/; do
  if [ -f "${dir%/}/out.png" ]; then
    echo "done: ${dir%/}/out.png"
  else
    echo "MISSING: ${dir%/} → log.txt を確認して個別再実行"
  fi
done
