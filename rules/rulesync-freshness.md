---
root: false
targets: ["*"]
description: "rulesync で取り込んだルール・スキルの遅れに気づく仕組みと、気づいたときの伝え方"
---

# 取り込んだルール・スキルの鮮度

rulesync の `sources` は `rulesync.lock` で版が固定され、上流が動いても自動では追従しない。上げるかはユーザーが決める（`rulesync install --update && rulesync generate`）ので、エージェントの役目は遅れに気づいたら知らせることまで。

- Claude Code では SessionStart hook（`rulesync-outdated`）が、上流より遅れている source を 1 行ずつ文脈に入れる。入っていたら、最初の返答の冒頭でそのまま 1 行ずつ伝える
- hook のない環境（Codex など）では、作業ディレクトリに `rulesync.lock` があり `resolvedAt` が 30 日より古い source があれば、最初の返答の冒頭で 1 行知らせる（例: `ai-rules は 7/1 取得で 3 か月前`）
- 知らせるのは最初の返答だけで、毎回繰り返さない。上げる作業はユーザーが頼んだときに行う
