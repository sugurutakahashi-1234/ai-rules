---
name: seo-audit
description: When the user wants to audit, review, or diagnose SEO issues on the site. Also use when the user mentions "SEO audit," "technical SEO," "why am I not ranking," "SEO issues," "on-page SEO," "meta tags review," "SEO health check," "my traffic dropped," "lost rankings," "not showing up in Google," "page speed," "core web vitals," "crawl errors," or "indexing issues." Use this even for vague requests such as "my SEO is bad"; start with an audit. For adding structured data, see schema. For AI search optimization, see ai-seo.
metadata:
  local_reviewed: 2026-09-08
  version: 2.0.0
  source: https://github.com/coreyhaines31/marketingskills/tree/main/skills/seo-audit
  forked_at: 7868cb9251fad80a73d26e488a5ad5f6c4a9f335
---

# SEO Audit
> 由来: coreyhaines31/marketingskills（MIT）。上流から派生して独自に管理する。上流には追従しない（上位互換の点検は skills-review スキル）。


You are an expert in search engine optimization. Your goal is to identify SEO issues and provide actionable recommendations to improve organic search performance.

## Initial Assessment

**Check for product marketing context first:**
If `.agents/product-marketing.md` exists (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md` filename, in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before auditing, understand:

1. **Site Context**
   - What type of site? (SaaS, e-commerce, blog, etc.)
   - What's the primary business goal for SEO?
   - What keywords/topics are priorities?

2. **Current State**
   - Any known issues or concerns?
   - Current organic traffic level?
   - Recent changes or migrations?

3. **Scope**
   - Full site audit or specific pages?
   - Technical + on-page, or one focus area?
   - Access to Search Console / analytics?

---

## Audit Framework

### 構造化データの検出と証拠

HTMLをテキスト化する取得ツールは script を落とすことがある。まずHTTP応答の生HTMLとヘッダーを保存し、JSON-LDをパースする。curl はSSG/SSRが出力したJSON-LDを確認できるが、JavaScriptは実行しない。生HTMLにない場合はrendered DOM、必要に応じてRich Results Testで確認し、取得失敗を「構造化データなし」と扱わない。

各指摘にはURL、環境、取得日時、HTTP状態、該当箇所、観測方法を付ける。ローカルでの存在、公開配信、Googleでのindex・表示は別々に検証する。

### Priority Order

1. **Crawlability & Indexation** (can Google find and index it?)
2. **Technical Foundations** (is the site fast and functional?)
3. **On-Page Optimization** (is content optimized?)
4. **Content Quality** (does it deserve to rank?)
5. **Authority & Links** (does it have credibility?)

---

## Technical SEO Audit

### Crawlability

**Robots.txt**

- Check for unintentional blocks
- Verify important pages allowed
- Check sitemap reference

**XML Sitemap**

- Exists and accessible
- Submitted to Search Console
- Contains only canonical, indexable URLs
- `lastmod` は本文・構造化データ・リンク等の重要な更新日を正確に表す。ビルドのたびに全URLを今日へ更新しない。Googleは `priority` / `changefreq` を使わない
- Proper formatting

**Site Architecture**

- Important pages within 3 clicks of homepage
- Logical hierarchy
- Internal linking structure
- No orphan pages

**Crawl Budget Issues** (for large sites)

- Parameterized URLs under control
- Faceted navigation handled properly
- Infinite scroll with pagination fallback
- Session IDs not in URLs

### Indexation

**Index Status**

- Search Console Page indexing と重要URLのURL Inspectionを優先する
- `site:` は補助的な発見手段であり、網羅的なindex件数や不掲載の証明に使わない
- Compare indexed vs. expected

**Indexation Issues**

- Noindex tags on important pages
- Canonicals pointing wrong direction
- Redirect chains/loops
- Soft 404s
- Duplicate content without canonicals

**Canonicalization**

- index対象ページのcanonicalと内部リンク・sitemap・redirectを整合させる。canonicalはシグナルであり、Google選択canonicalもURL Inspectionで確認する
- Self-referencing canonicals on unique pages
- HTTP → HTTPS canonicals
- www vs. non-www consistency
- Trailing slash consistency

### Site Speed & Core Web Vitals

**Core Web Vitals**

- 良好の目安: LCP ≤ 2.5s、INP ≤ 200ms、CLS ≤ 0.1。実ユーザーデータの75パーセンタイルで評価する
- URL単位/オリジン単位、モバイル/デスクトップ、集計期間を記録する。CrUX未取得は未取得とし、Lighthouseのラボ値やTBTを実測INPの代用にしない

**Speed Factors**

- Server response time (TTFB)
- Image optimization
- JavaScript execution
- CSS delivery
- Caching headers
- CDN usage
- Font loading

**Tools**

- PageSpeed Insights
- WebPageTest
- Chrome DevTools
- Search Console Core Web Vitals report

### Mobile-Friendliness

- Responsive design (not separate m. site)
- Tap target sizes
- Viewport configured
- No horizontal scroll
- Same content as desktop
- Mobile-first indexing readiness

### Security & HTTPS

- HTTPS across entire site
- Valid SSL certificate
- No mixed content
- HTTP → HTTPS redirects
- HSTS header (bonus)

### URL Structure

- Readable, descriptive URLs
- Keywords in URLs where natural
- Consistent structure
- No unnecessary parameters
- Lowercase and hyphen-separated

---

## International SEO & Localization

複数言語・地域を提供する場合だけ [International SEO reference](references/international-seo.md) を読む。実在する翻訳本文と相互hreflangを確認する。言語数による実装方式の固定閾値や、低品質ページへのnoindex一律禁止は設けない。

---

## On-Page SEO Audit

### Title Tags

**Check for:**

- Unique titles for each page
- Primary keyword near beginning
- 固定文字数で合否を決めず、内容の識別性・簡潔さ・言語・端末上の表示を確認する。Googleの表示は幅に応じて省略される
- Compelling and click-worthy
- Brand name placement (end, usually)

**Common issues:**

- Duplicate titles
- Too long (truncated)
- 内容を識別できない曖昧なタイトル
- Keyword stuffing
- Missing entirely

### Meta Descriptions

**Check for:**

- Unique descriptions per page
- ページ固有の正確な要約。固定文字数をGoogle要件にしない。スニペットは検索語により本文からも生成される
- Includes primary keyword
- Clear value proposition
- Call to action

**Common issues:**

- Duplicate descriptions
- Auto-generated garbage
- 冗長、曖昧、または本文と不一致
- No compelling reason to click

### Heading Structure

**Check for:**

- One H1 per page
- H1 contains primary keyword
- Logical hierarchy (H1 → H2 → H3)
- Headings describe content
- Not just for styling

**Common issues:**

- 主見出しが曖昧。H1数だけでGoogleのペナルティと判定しない（リポジトリの見出し規約は別途守る）
- Skip levels (H1 → H3)
- Headings used for styling only
- No H1 on page

### Content Optimization

**Primary Page Content**

- 冒頭で読者の課題と得られる答えを明確にする。最初の100語へのキーワード挿入を必須にしない
- Related keywords naturally used
- Sufficient depth/length for topic
- Answers search intent
- Better than competitors

**Thin Content Issues**

- Pages with little unique content
- Tag/category pages with no value
- Doorway pages
- Duplicate or near-duplicate content

### Image Optimization

**Check for:**

- Descriptive file names
- 情報画像には目的を伝えるalt、装飾画像には空のaltを使う
- Alt text describes image
- Compressed file sizes
- Modern formats (WebP)
- 画面外画像は遅延読み込みを検討し、LCP候補・主要な初期表示画像を一律にlazyにしない
- Responsive images

### Internal Linking

**Check for:**

- Important pages well-linked
- Descriptive anchor text
- Logical link relationships
- No broken internal links
- Reasonable link count per page

**Common issues:**

- Orphan pages (no internal links)
- Over-optimized anchor text
- Important pages buried
- Excessive footer/sidebar links

### Keyword Targeting

**Per Page**

- Clear primary keyword target
- Title, H1, URL aligned
- Content satisfies search intent
- 同じ語句を扱うだけで競合と判定しない。クエリ別の着地URL・検索意図・成果を確認してから統合を検討する

**Site-Wide**

- Keyword mapping document
- No major gaps in coverage
- 意図の異なるページをキーワード重複だけで削除・統合しない
- Logical topical clusters

---

## Content Quality Assessment

### E-E-A-T Signals

**Experience**

- First-hand experience demonstrated
- Original insights/data
- Real examples and case studies

**Expertise**

- Author credentials visible
- Accurate, detailed information
- Properly sourced claims

**Authoritativeness**

- Recognized in the space
- Cited by others
- Industry credentials

**Trustworthiness**

- Accurate information
- Transparent about business
- Contact information available
- Privacy policy, terms
- Secure site (HTTPS)

### Content Depth

- Comprehensive coverage of topic
- Answers follow-up questions
- Better than top-ranking competitors
- Updated and current

### User Engagement Signals

- Time on page
- Bounce rate in context
- Pages per session
- Return visits

---

## Common Issues by Site Type

### SaaS/Product Sites

- Product pages lack content depth
- Blog not integrated with product pages
- Missing comparison/alternative pages
- Feature pages thin on content
- No glossary/educational content

### E-commerce

- Thin category pages
- Duplicate product descriptions
- Missing product schema
- Faceted navigation creating duplicates
- Out-of-stock pages mishandled

### Content/Blog Sites

- Outdated content not refreshed
- Keyword cannibalization
- No topical clustering
- Poor internal linking
- Missing author pages

### Multilingual / Multi-Regional Sites

- Hreflang errors (missing return tags, invalid codes, no self-reference)
- Canonical conflicting with hreflang (cross-locale canonical suppresses indexing)
- Thin locale pages dragging down site-wide quality signal
- Only boilerplate translated, main content identical across locales
- No x-default fallback declared
- Sitemap missing hreflang alternates or missing reciprocal entries
- IP-based redirects hiding content from Googlebot
- Framework locale mode hiding locale from URLs

### Local Business

- Inconsistent NAP
- Missing local schema
- No Google Business Profile optimization
- Missing location pages
- No local content

---

## Output Format

### Audit Report Structure

**Executive Summary**

- Overall health assessment
- Top 3-5 priority issues
- Quick wins identified

**Technical SEO Findings**
For each issue:

- **Issue**: What's wrong
- **Impact**: SEO impact (High/Medium/Low)
- **Evidence**: How you found it
- **Fix**: Specific recommendation
- **Priority**: 1-5 or High/Medium/Low

**On-Page SEO Findings**
Same format as above

**Content Findings**
Same format as above

**Prioritized Action Plan**

1. Critical fixes (blocking indexation/ranking)
2. High-impact improvements
3. Quick wins (easy, immediate benefit)
4. Long-term recommendations

---

## References

- [文章品質のレビュー](references/ai-writing-detection.md): 事実・具体性・読みやすさを評価する。文体からAI生成や検索違反を断定しない
- [International SEO](references/international-seo.md): Evidence and sources for hreflang, canonical + i18n, sitemaps, URL structure, and content quality across locales
- For AI search optimization (AEO, GEO, LLMO, AI Overviews), see the **ai-seo** skill

---

## Tools Referenced

**Free Tools**

- Google Search Console (essential)
- Google PageSpeed Insights
- Bing Webmaster Tools
- Rich Results Test (**use this for schema validation — it renders JavaScript**)
- Mobile-Friendly Test
- Schema Validator

> **Note on schema detection:** `web_fetch` strips `<script>` tags (including JSON-LD) and cannot detect JS-injected schema. Use the browser tool, Rich Results Test, or Screaming Frog instead — they render JavaScript and capture dynamically-injected markup. See the Schema Markup Detection Limitation section above.

**Paid Tools** (if available)

- Screaming Frog
- Ahrefs / Semrush
- Sitebulb
- ContentKing

---

## Task-Specific Questions

1. What pages/keywords matter most?
2. Do you have Search Console access?
3. Any recent changes or migrations?
4. Who are your top organic competitors?
5. What's your current organic traffic baseline?

---

## Related Skills

- **ai-seo**: For optimizing content for AI search engines (AEO, GEO, LLMO)
- **schema**: For implementing structured data
- **cro**: For optimizing pages for conversion (not just ranking)

## 診断の追加チェックと根拠

- robots.txt はクロール制御で、index削除やアクセス保護ではない。`noindex` を読み取れるクロール状態か、HTTPの `X-Robots-Tag` とmetaが矛盾しないかを確認する。PDF等はヘッダーも対象。認証が必要な内容の保護をrobotsで代用しない。
- 流入低下は同じ長さ・曜日構成の期間、前年同期、検索タイプ、国、端末、ページ、クエリに分解する。表示回数・クリック・CTR・順位を分け、季節性、計測変更、公開変更、障害、検索更新を照合してから原因仮説を置く。相関だけで原因を断定しない。
- 指摘は影響・確度・対応コストで優先し、「観測」「仮説」「提案」「検証結果」を分ける。変更後すぐの順位変動を効果の証明にしない。再計測条件と期間を定める。

公式確認先（仕様を変更するときは再取得する）:

- [タイトル](https://developers.google.com/search/docs/appearance/title-link) / [スニペット](https://developers.google.com/search/docs/appearance/snippet)
- [robots meta / HTTP header](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [流入低下の診断](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
- [Core Web Vitals](https://web.dev/articles/vitals)
