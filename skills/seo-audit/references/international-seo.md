# 多言語・地域SEO

出典: coreyhaines31/marketingskills（MIT）の参考資料をローカル改変。実装判断では下記の一次情報を再確認する。

- HTML、HTTP Linkヘッダー、sitemapのhreflangは同等の方法。保守しやすい方法を選び、併用時は内容を一致させる。言語数だけで方式を固定しない。
- 実際に対応するページ間で自己参照と相互参照を確認する。言語コードと任意の地域コードを検証する。
- `x-default` は言語選択ページなどフォールバックを表す推奨指定で、欠落だけで必須エラーとしない。
- Googleは本文から言語を判断する。ナビだけを翻訳して翻訳ページとして量産しない。HTMLのlangはアクセシビリティのためにも正確にする。
- canonicalは同言語の正規ページを基本にし、hreflang・内部リンク・sitemapと整合させる。同一言語の地域別重複も考慮する。すべての地域ページを無条件に自己canonicalとしない。
- 公開価値のない翻訳を作らない。既存ページは改善、公開保留、noindex、廃止等を目的と実態から判断する。noindexを一律禁止せず、処理にクロールが必要なことを確認する。
- 検索エンジン別の対応をGoogleの仕様から推測しない。Bing等への追加メタタグは現在の公式仕様と必要性を確認してから採用する。

公式資料:

- [多言語・地域版の指定](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [多地域・多言語サイト](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites)
- [重複URLの正規化](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
