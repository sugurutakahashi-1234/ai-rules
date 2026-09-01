# AI Search Access and Measurement

Platform behavior changes quickly, and most source-selection algorithms are not public. Use this reference to verify access and measurement; do not invent platform-specific ranking factors from correlation studies.

## Evidence Rules

1. Use first-party product and crawler documentation for current behavior.
2. Treat third-party prompt studies as dated samples with a stated population, locale, model, and collection method.
3. Do not turn a correlation, benchmark score, or vendor heuristic into a promised traffic or citation lift.
4. Separate search/citation crawling, training crawling, and user-requested retrieval.
5. Recheck crawler names and reporting surfaces before changing `robots.txt`.

## Google Search

Google says its generative AI features use the same core Search ranking and quality systems. A page must meet ordinary Search technical requirements and be eligible for snippets. There is no special AI schema, required Markdown file, ideal answer length, or required content chunking.

- [`llms.txt` and similar files do not help or hurt Google Search visibility](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
- Structured data is useful only when it accurately describes visible content and supports an ordinary documented Search feature; it is not required for generative AI Search.
- `Googlebot` is the Search crawler. `Google-Extended` controls specified Gemini uses and does not affect inclusion or ranking in Google Search.
- Use the standard Search Console reports and, where available, the separate Generative AI performance report. The latter is an additional view, not a complete cross-platform report.

Do not infer that a schema type, Wikipedia entry, content length, publication frequency, or fixed passage format is a Google AI visibility lever unless current Search documentation says so.

## Microsoft Bing and Copilot

Bing's ordinary crawl and index remain the discovery foundation. XML sitemaps and truthful `lastmod` values help Bing understand coverage and recrawl needs. IndexNow notifies participating engines that a URL changed; receipt does not guarantee crawling, indexing, ranking, or citation.

[Bing Webmaster Tools AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) reports:

- total citations
- average cited pages
- sampled grounding queries
- page-level citation activity
- trends over time

[The June 2026 preview expansion](https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare) adds:

- intent labels for sampled grounding queries
- topic clusters
- citation share for a grounding query
- period comparison

Microsoft explicitly notes that these figures do not indicate placement, authority, importance, traffic share, or ranking. Citation share is the site's percentage of displayed citations for the same sampled grounding query, not a quality score or competitor-domain report. Intent/topic labels are evolving AI classifications and may be broad. Measure them alongside Search Performance, referrals, and the user's downstream action.

## OpenAI

Check [OpenAI's crawler documentation](https://developers.openai.com/api/docs/bots) before writing policy.

| Purpose               | Documented user agent |
| --------------------- | --------------------- |
| Search inclusion      | `OAI-SearchBot`       |
| Training              | `GPTBot`              |
| User-requested access | `ChatGPT-User`        |

Allowing one role does not imply allowing the others. `GPTBot` is not the search crawler.

## Anthropic

Check [Anthropic's crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) before writing policy.

| Purpose               | Documented user agent |
| --------------------- | --------------------- |
| Search                | `Claude-SearchBot`    |
| Training              | `ClaudeBot`           |
| User-requested access | `Claude-User`         |

Do not assume a particular third-party search backend or a private source-selection threshold. Verify the visible result and citation instead.

## Perplexity

Check [Perplexity's crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) before writing policy.

| Purpose               | Documented user agent |
| --------------------- | --------------------- |
| Search                | `PerplexityBot`       |
| User-requested access | `Perplexity-User`     |

Do not claim that FAQ schema, PDFs, a publication cadence, or a fixed paragraph shape receives a ranking boost without a current first-party source.

## Robots Policy Checklist

Before editing `robots.txt`:

1. Write the business decision separately for search/citation, training, and user-requested access.
2. Confirm each current user agent in first-party documentation.
3. Check CDN or platform-managed rules that may modify the served file.
4. Verify the production response, not just the repository source.
5. Remember that crawl permission is neither a ranking signal nor a guarantee of citation.
6. Use `noindex` or the platform's removal mechanism when exclusion from search is the actual goal; `robots.txt` only controls crawling.

## Measurement Checklist

For every platform sample, record:

- date, locale, account state, and device
- exact query or prompt
- whether the experience appeared
- cited URL and canonical URL
- whether the citation led to a referral or useful user action
- what the first-party console reported, if anything

Keep these measures separate:

1. indexed or discoverable
2. shown in search
3. retrieved
4. cited
5. mentioned or recommended
6. visited
7. acted upon

No single tool score or citation count represents the whole path.
