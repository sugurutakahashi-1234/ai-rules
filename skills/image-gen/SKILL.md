---
name: image-gen
description: "Codex 組み込みの image_gen（gpt-image-2、ChatGPT サブスク経由）で画像を生成する共通エンジン。呼び出し規約・並列一括生成・ハマりどころ・gpt-image-2.5（API 限定）との関係の正本で、md-infographic などの媒体スキルから参照される。Use when 画像・挿絵・アイキャッチ・インフォグラフィックを生成したいとき。"
---

# image-gen（gpt-image-2 で画像を生成する）

画像生成は Codex の組み込み `image_gen`（gpt-image-2）で行い、ChatGPT サブスク内で完結させる。OpenAI Images API の従量課金ルートには入らない。Claude Code 自身は画像を生成できないので、Codex CLI を子プロセスとして呼ぶ。トーン・構図・合格基準などのスタイル定型は各媒体スキル（md-infographic 等）が持ち、ここには媒体によらない共通の作法だけを置く。

## モデルの現状（2026-09）

- 組み込み `image_gen` はモデルを選べず、gpt-image-2 固定（ツール引数は `prompt` / `referenced_image_paths` / `num_last_images_to_include` のみ。Codex CLI のソースもモデル名を固定している）
- gpt-image-2.5 は API 限定（2026-09-08 公開。`gpt-image-2.5-flare` = 高速・既定、`gpt-image-2.5-sunburst` = 編集精度重視）。Codex の組み込みツールには 2.5 を指定する手段も、使われたモデルを返す仕組みも無い（[openai/codex#43965](https://github.com/openai/codex/issues/43965)）。「2.5 で作って」と頼まれたら、サブスクルートでは選べず確認もできないことを伝えて gpt-image-2 で進める
- API ルートは、ユーザーが「API 課金してよい」と明示して 2.5 を指名したときだけの例外。2.5 は `background: transparent`（png / webp）、`quality` の `xhigh` / `max`、任意サイズ（辺は 16 の倍数・最大 3840px・縦横比 1:3〜3:1）に対応し、トークン単価は gpt-image-2 と同じ
- 生成物のメタデータではモデルを判別できない（C2PA の `softwareAgent` は 2.5 指名でも `gpt-image 2.0` と出る報告がある）。「2.5 で作った」と断言する根拠にしない
- Codex 側が組み込みツールにモデル選択か有効モデルの表示を付けたら（上記 issue、`codex` リリースノート、`codex-rs/ext/image-generation` の変更で確認）、この節と下の制約を書き換える

## 進め方

用途・枚数・トーンを合意し、複数枚なら 1 枚試作して合意を取ってから残りを並列で一括生成する。生成した画像は 1 枚ずつ開いて文字化け・誤字・内容違いを確認し、崩れた 1 枚だけ再生成する。gpt-image は文字を創作・誤記するので、金額・固有名詞・区分・日付のように意味が変わる誤字を特に見る。置き場所とファイル名はリポジトリの規約に従う（規約が無ければ 1 案件・1 テーマにつき 1 フォルダ、ファイル名は内容が分かる英語スラッグ、連番が要る用途は `<NN>-<slug>.png`）。push は社外公開になるので、commit / push はユーザーの指示があってから。

## プロンプトの作法（媒体スキル共通）

- 画像内に文字を入れるときは、本文から逐語の正確な文字列を渡す。「○○について」のような曖昧指示だと創作・誤字になる。文字は多めでよい（逐語で渡せば高密度でも崩れにくい。「画像だから文字は少なめに」は誤り）。表は「A｜B｜C」の区切りで列を明示する
- カタカナ長音の直後に漢数字「一」が来る語は崩れる（「マスタ一元化」が「マスター元化」になる）。表記を変える（「マスタの一元化」）か、【文字の厳守】行で正誤を明示する。「ユーザ一覧」「サーバ一台」も同型
- タイトルを描かせるときは見出し化の指定（太字・大きめ・マーカー下線）を入れる。指定しないと本文と同じ大きさになる

## 呼び出し（Codex 経由・API 課金を発生させない）

前提: `~/.codex/auth.json` の `OPENAI_API_KEY` が `null`（サブスク＝ChatGPT OAuth ルート。値が入っていたら従量課金の恐れがあるのでユーザーに確認）、`tokens.id_token` に `chatgpt_plan_type` があり有効期間内、`which codex` が通る。

```bash
codex exec --dangerously-bypass-approvals-and-sandbox --cd "<スクラッチディレクトリ>" "<プロンプト>" < /dev/null
```

- `< /dev/null` を付ける。stdin が開いたままだと `codex exec` は「Reading additional input from stdin...」で入力を待ち続け、バックグラウンド実行やスクリプト内では止まったままになる（フォアグラウンドのツール実行では偶然 EOF になり動くので気づきにくい）
- `--full-auto` はサンドボックスのネットワークブロックで `fetch failed` になるため、`--dangerously-bypass-approvals-and-sandbox` を使う
- プロンプトに「組み込みの image_gen ツールを直接使う。API キーやスクリプトは不要。OpenAI Images API を直接叩かない」を入れる。入れないと Codex が API 直叩きスクリプトを自動生成して課金ルートに逸れる
- `--cd` はリポジトリ実体に向けず、スクラッチディレクトリ（/tmp のジョブディレクトリ等）を指す。codex は `--cd` 配下へ独自判断で画像を保存することがあり、リポジトリの画像ディレクトリを指すと確定済みの画像を上書きする
- 生成物は `--cd` ではなく `~/.codex/generated_images/<session>/ig_*.png` に出ることが多い。1 枚だけなら生成直後に `ls -t ~/.codex/generated_images/*/*.png | head -1` で最新を拾って `cp` してよい。この「最新ファイル」方式は並列だと混線するので、複数枚では下の並列一括生成を使う
- 保存・リネームはこちらのスクリプト側でやる。プロンプトに「./xx.png で保存して」と書くと Codex の自主的な保存と二重になり重複ファイルが残る。「生成した画像の絶対パスを最終メッセージで出力して」と頼むのは保存指示ではないので問題ない（並列一括生成のマッピングに使う）
- OpenAI 側が不安定だと `ERROR: Reconnecting... N/5` のままログ更新が止まり、何十分もハングする（放置では回復しないことが多い）。打ち切り基準は「`ERROR: Reconnecting` の後 90 秒以上ログ更新がない」または「1 試行が 8 分超」。kill して同じプロンプトで再実行すれば大抵通る。単発実行も `run_in_background` で起動してログを見る

gpt-image-2 の制約: 透過背景非対応（真の透過が要るなら API ルートの 2.5 + `background: transparent` になるので、課金の可否を先に確認）。辺は 16 の倍数・最大 3840px。横 1536 × 縦 1024（横長）と横 1024 × 縦 1536（縦長）が扱いやすい。組み込みツールにサイズ・quality の引数は無いので、縦横比や「高解像度で」はプロンプト内で指定する。

## 複数枚の並列一括生成

1 枚あたり 1〜3 分かかるので、合意後の一括生成は並列で行う。ジョブ↔画像の対応は「ジョブ専用ディレクトリ + `--output-last-message`」で決定的に取れる。

1. ジョブルート（例 `/tmp/imggen-<slug>/`）配下に 1 枚ごとの `job-<NN>/` を作り、`job-<NN>/prompt.txt` にプロンプト全文を書く（ファイル渡しにすると長い日本語プロンプトの引用符エスケープ事故も防げる）
2. 同梱の `scripts/parallel-imggen.sh` を `run_in_background: true` で実行する: `zsh <スキルのディレクトリ>/scripts/parallel-imggen.sh /tmp/imggen-<slug>`。各ジョブを `--cd job-<NN>` + `-o job-<NN>/last.txt` 付きで並列起動し、最終メッセージから PNG パスを取り出して `job-<NN>/out.png` に確定させる。上のハング打ち切りと自動リトライ（`STALL_SECS` 90 秒、`ATTEMPT_TIMEOUT` 480 秒、`MAX_ATTEMPTS` 3 回）は組み込み済み
3. 完了後、各 `job-<NN>/out.png` を目的の置き場所へ `<NN>-<slug>.png` としてコピーする。`out.png` が無いジョブだけ `log.txt` を見て個別に再実行する
4. 同時実行数は `MAX_PARALLEL`（既定 4）。レート制限系のエラーが出ていなければ上げてよく、出たら下げて失敗分だけ再実行する

並列化しても「1 枚試作 → 合意 → 残りを一括」の順序と、生成後に 1 枚ずつ開く確認は省かない。

## やらないこと

- OpenAI Images API を直接叩かない（API キー・従量課金ルート）
- HTML/CSS/Playwright/SVG で「画像化した図表」を作って画像生成の代替にしない（ユーザーが明示した場合を除く）
- 公開画像の置き場所に作業ファイル（動画・PSD 等）や未確認の候補を置かない
