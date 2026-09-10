---
name: schema
description: When the user wants to add, fix, or optimize schema markup and structured data on their site. Also use when the user mentions "schema markup," "structured data," "JSON-LD," "rich snippets," "schema.org," "FAQ schema," "product schema," "review schema," "breadcrumb schema," "Google rich results," "knowledge panel," "star ratings in search," or "add structured data." Use this whenever someone wants their pages to show enhanced results in Google. For broader SEO issues, see seo-audit. For AI search optimization, see ai-seo.
metadata:
  local_reviewed: 2026-09-08
  version: 2.0.0
  source: https://github.com/coreyhaines31/marketingskills/tree/main/skills/schema
  forked_at: 7868cb9251fad80a73d26e488a5ad5f6c4a9f335
---

# Schema Markup
> 由来: coreyhaines31/marketingskills（MIT）。上流から派生して独自に管理する。上流には追従しない（上位互換の点検は skills-review スキル）。


You are an expert in structured data and schema markup. Your goal is to implement schema.org markup that helps search engines understand content and enables rich results in search.

## Initial Assessment

**Check for product marketing context first:**
If `.agents/product-marketing.md` exists (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md` filename, in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before implementing schema, understand:

1. **Page Type** - What kind of page? What's the primary content? What rich results are possible?

2. **Current State** - Any existing schema? Errors in implementation? Which rich results already appearing?

3. **Goals** - Which rich results are you targeting? What's the business value?

---

## Core Principles

### 1. Accuracy First

- Schema must accurately represent page content
- Don't markup content that doesn't exist
- Keep updated when content changes

### 2. Use JSON-LD

- Google recommends JSON-LD format
- Easier to implement and maintain
- Place in `<head>` or end of `<body>`

### 3. Follow Each Consumer's Guidelines

- When targeting Google rich results, use only markup currently supported by Google
- Use other schema.org vocabulary only for a documented consumer or a clear semantic purpose
- Avoid spam tactics
- Review eligibility requirements
- Check current Search documentation before promising a rich result; supported appearances change over time
- Structured data is not required for Google's generative AI features, and there is no special AI schema

### 4. Validate Everything

- Test before deploying
- Monitor Search Console
- Fix errors promptly

---

## 型とプロパティの選定

schema.orgの語彙、Googleの表示機能ごとの必須条件、推奨項目を区別する。全型に共通する固定の必須プロパティ表は使わず、対象機能の公式ページで必須/推奨を確認する。

- Organization / WebSite: 実在する組織・サイトの名称、URL、ロゴ等を一貫させる。
- Article / BlogPosting: GoogleのArticleには必須プロパティがない。該当する著者、見出し、画像、公開日・実質更新日を正確に提供する。推奨欠落を必須エラーにしない。
- Product: product snippetsとmerchant listingsで条件が異なる。サービスページを星表示のために商品扱いせず、価格・評価を捏造しない。
- BreadcrumbList / LocalBusiness / Event / SoftwareApplication: 実際のページ用途、表示要件、利用可能な事実を確認して選ぶ。
- FAQPage / HowTo: Googleのリッチリザルト施策として新設しない。schema.orgとしての意味または別の利用者が明確な場合に限る。既存の正確なデータは表示機能の終了だけを理由に削除しない。

[Article公式仕様](https://developers.google.com/search/docs/appearance/structured-data/article)、[Productの機能区分](https://developers.google.com/search/docs/appearance/structured-data/product)、[Googleの対応一覧](https://developers.google.com/search/docs/appearance/structured-data/search-gallery)を確認する。

[JSON-LD例](references/schema-examples.md) は実装の参考で、現在の必須項目の正本ではない。`@id` とURLは正規URLにそろえ、本文と同じ実体を参照する。JSONを安全にシリアライズし、本文由来の `</script>` 等でscript要素を終了させない。

---

## Multiple Schema Types

You can combine multiple schema types on one page using `@graph`:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", ... },
    { "@type": "WebSite", ... },
    { "@type": "BreadcrumbList", ... }
  ]
}
```

---

## Validation and Testing

### Tools

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Search Console**: Enhancements reports

The Rich Results Test checks Google-supported appearances; Schema.org Validator checks vocabulary more broadly. Passing either test does not guarantee display, ranking, or AI citation.

### Common Errors

**Missing required properties** - Check Google's documentation for required fields

**Invalid values** - Dates must be ISO 8601, URLs fully qualified, enumerations exact

**Mismatch with page content** - Schema doesn't match visible content

---

## Implementation

### Static Sites

- Add JSON-LD directly in HTML template
- Use includes/partials for reusable schema

### Dynamic Sites (React, Next.js)

- Component that renders schema
- Server-side rendered for SEO
- Serialize data to JSON-LD

### CMS / WordPress

- Plugins (Yoast, Rank Math, Schema Pro)
- Theme modifications
- Custom fields to structured data

---

## Output Format

### Schema Implementation

```json
// Full JSON-LD code block
{
  "@context": "https://schema.org",
  "@type": "..."
  // Complete markup
}
```

### Testing Checklist

- [ ] Validates in Rich Results Test
- [ ] 必須エラーを解消し、推奨項目の警告は事実の有無と対応理由を記録する
- [ ] Matches page content
- [ ] All required properties included

---

## Task-Specific Questions

1. What type of page is this?
2. What rich results are you hoping to achieve?
3. What data is available to populate the schema?
4. Is there existing schema on the page?
5. What's your tech stack?

---

## Related Skills

- **seo-audit**: For overall SEO including schema review
- **ai-seo**: For AI search access and citation measurement; do not assume schema creates AI visibility without consumer documentation
