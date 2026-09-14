---
root: false
targets: ["*"]
description: "GitHub Actions の制約（SHA ピン・skip の扱い・デプロイのゲート・失敗を通知に使うときの前提）"
globs: [".github/workflows/**"]
---

# GitHub Actions の制約

## uses: は SHA ピンを維持する

タグは書き換えられるので、SHA でないと固定にならない。tj-actions/changed-files は全タグを一斉に汚染され、参照していたリポジトリが同時に影響を受けた。

- 新しく足すときは `pinact run` で SHA 化する（`# v4.1.0` のような版コメントも pinact が付ける）
- 検査は `pinact run --fix=false --no-api`。40 文字 SHA の構文検査だけなのでオフライン・トークン不要で 0.1 秒。commit 前に止めたいので pre-commit に置き、hook を入れ忘れた環境と bot の push を拾うために CI にも置く
- SHA ピンは「壊れないが古びる」トレードオフなので、**上げる係を別に決めておく**。固めただけで放置すると数年前の action を使い続けることになる

## 毎回必ず skip される条件を job の if: に置かない

job を丸ごと skip すると run の conclusion が `skipped` になる。GitHub の Slack App はこれを ❌ failed として流す（アプリ側に conclusion での絞り込みが無く、event / branch / actor しか指定できない）。**壊れていないのに ❌ が出ると、通知全体が読まれなくなる。**

- 毎回評価されて毎回 false になる条件（bot 起票の除外など）は **step の `if:`** に置く。job は success で終わり、conclusion が実態と一致する
- 必ず成功する gate job を `needs` の前に挟んで、workflow の conclusion を success 側に倒す形でもよい
- **人が意図的に作る draft PR のような低頻度の skip は job の `if:` のままでよい。** そこへ gate job を足すのは、正しい設計を通知の都合で歪めることになる
- リリース PR を draft で作る仕組み（release-please の `draft-pull-request` など）は、この誤報を毎回生む上に「マージしたら本番に出る PR で CI が一度も走らない」状態を作る

## 本番に書き込む job は同じ run の中で検証を通す

別ワークフローの CI と並行に置くと、CI の結果と無関係に本番へ出る。

- 検証 job を `needs` に持つ。`workflow_call` で既存 CI を呼ぶか、検証ステップを deploy job の中に持つ
- **検証 job の `if:` に `always()` / `!cancelled()` を足さない。** `needs` の暗黙の `success()` が外れてゲートが無効になる
- **paths フィルタで skip された job は `needs` 上「素通し」になる。** フィルタから漏れたパスの変更が無検証で本番へ出る

## 失敗を通知経路として使うなら、嘘をつかせない

「全部緑だと誰もサマリを開かないので、失敗そのものを通知にする」は有効な設計だが、**壊れていないのに赤くなる状態を一度でも常態化させると、その通知は二度と読まれない。**

- 止めるのは「その変更が原因のもの」だけにする（構文エラー、ピン崩れ、新しく入った脆弱性）
- 誰も何もしていないのに赤くなるもの（依存が古びた、外部の値が変わった、修正版の無い advisory）は CI で止めず、別の経路で知らせる
- 検査を足した直後に既存の指摘で赤くなったときは、**除外して見えなくするのではなく、指摘そのものを潰す**。除外を残すと将来の本物の指摘まで見えなくなる
