---
root: false
targets: ["*"]
description: "ブラウザを使う作業の道具の選び方（ログインが要る操作はユーザーの Chrome、自サイトの検証は内蔵ブラウザ、外部 Playwright MCP は使わない）"
---

# ブラウザ作業の道具

用途で分ける。道具を増やすより、用途ごとに 1 つに決めておく方が、リポごとの食い違いと余計な MCP の常駐を防げる。

- 管理コンソールやログインが要るサービスの操作・確認は、ユーザーのログイン済み Chrome を使う（Claude Code は claude-in-chrome、Codex は `@Chrome`）。MFA / SSO を突破しようとせず、切れていたらユーザーにログインを依頼して待つ
- 自分のサイト・アプリの見た目と動作の確認（ローカル dev・公開ページ）は、エージェント内蔵のブラウザで足りる（Claude Code は claude-in-chrome、Codex は `@Browser`）。回帰の担保はリポの E2E テスト（Playwright のコード）が持つ
- 外部の Playwright MCP は標準経路にしない。ヘッドレスの別セッションなので SSO を通せず、プロセスが残留する
- 追加の MCP（chrome-devtools 等）は、内蔵ブラウザで取れない情報（performance trace、console / network の詳細）が要るときだけ、そのリポの設定に理由を書いて宣言する
