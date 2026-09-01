---
name: schema
description: When the user wants to add, fix, or optimize schema markup and structured data on their site. Also use when the user mentions "schema markup," "structured data," "JSON-LD," "rich snippets," "schema.org," "FAQ schema," "product schema," "review schema," "breadcrumb schema," "Google rich results," "knowledge panel," "star ratings in search," or "add structured data." Use this whenever someone wants their pages to show enhanced results in Google. For broader SEO issues, see seo-audit. For AI search optimization, see ai-seo.
metadata:
  version: 2.0.0
  source: https://github.com/coreyhaines31/marketingskills/tree/main/skills/schema
  revision: 7868cb9251fad80a73d26e488a5ad5f6c4a9f335
---

# Schema Markup
> 出典: coreyhaines31/marketingskills（MIT）。追従の基準は frontmatter の source / revision。ローカル改変あり。


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

## Common Schema Types

| Type                | Use For                                                    | Required Properties                    |
| ------------------- | ---------------------------------------------------------- | -------------------------------------- |
| Organization        | Company homepage/about                                     | name, url                              |
| WebSite             | Homepage                                                   | name, url                              |
| Article             | Blog posts, news                                           | headline, image, datePublished, author |
| Product             | Product pages                                              | name, image, offers                    |
| SoftwareApplication | SaaS/app pages                                             | name, offers                           |
| FAQPage             | Documented non-Google consumer; Google rich result retired | mainEntity (Q&A array)                 |
| HowTo               | Documented consumer; no Google rich result                 | name, step                             |
| BreadcrumbList      | Any page with breadcrumbs                                  | itemListElement                        |
| LocalBusiness       | Local business pages                                       | name, address                          |
| Event               | Events, webinars                                           | name, startDate, location              |

**For complete JSON-LD examples**: See [references/schema-examples.md](references/schema-examples.md)

---

## Quick Reference

### Organization (Company Page)

Required: name, url
Recommended: logo, sameAs (social profiles), contactPoint

### Article/BlogPosting

Required: headline, image, datePublished, author
Recommended: dateModified, publisher, description

### Product

Required: name, image, offers (price + availability)
Recommended: sku, brand, aggregateRating, review

### FAQPage

Required: mainEntity (array of Question/Answer pairs)

Google retired the FAQ rich result in May 2026. Do not add `FAQPage` as a Google rich-result tactic. It may still describe genuine visible FAQ content for schema.org or another documented consumer.

### BreadcrumbList

Required: itemListElement (array with position, name, item)

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
- [ ] No errors or warnings
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
