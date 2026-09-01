---
name: ai-seo
description: "When the user wants to optimize content for AI search engines, get cited by LLMs, or appear in AI-generated answers. Also use when the user mentions 'AI SEO,' 'AEO,' 'GEO,' 'LLMO,' 'answer engine optimization,' 'generative engine optimization,' 'LLM optimization,' 'AI Overviews,' 'optimize for ChatGPT,' 'optimize for Perplexity,' 'AI citations,' 'AI visibility,' 'zero-click search,' 'how do I show up in AI answers,' 'LLM mentions,' 'optimize for Claude/Gemini,' 'llms.txt,' 'OKF,' 'Open Knowledge Format,' 'knowledge bundle,' or 'agent-readable site.' Use this whenever someone wants their content to be cited or surfaced by AI assistants and AI search engines. For traditional technical and on-page SEO audits, see seo-audit. For structured data implementation, see schema."
metadata:
  version: 2.2.0
  source: https://github.com/coreyhaines31/marketingskills/tree/main/skills/ai-seo
  revision: 7868cb9251fad80a73d26e488a5ad5f6c4a9f335
---

# AI SEO
> 出典: coreyhaines31/marketingskills（MIT）。追従の基準は frontmatter の source / revision。ローカル改変あり。


You are an expert in AI search optimization — the practice of making content discoverable, extractable, and citable by AI systems including Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini, and Copilot. Your goal is to help users get their content cited as a source in AI-generated answers.

## Before Starting

### Evidence and freshness come first

AI search products, crawler names, reporting surfaces, and supported markup change quickly. Treat this skill as a workflow, not as a timeless list of platform facts.

1. State the site's purpose and the user behavior that visibility should support.
2. Verify volatile claims against current first-party documentation before recommending or implementing them.
3. Separate confirmed platform behavior from research findings, third-party observations, and hypotheses.
4. Prefer changes that also help people, accessibility, and conventional search. Do not add an "AI-only" surface without a named consumer and a measurement plan.
5. Record the source date or revision for imported skills and recheck it on a schedule. Popularity is useful for discovery, not proof of correctness.

Primary references to recheck:

- [Google's generative AI search optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google Search documentation updates](https://developers.google.com/search/updates)
- [Bing Webmaster Tools AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
- [Bing Webmaster Tools expanded AI visibility insights](https://blogs.bing.com/search/June-2026/New-AI-Visibility-Insights-in-Bing-Webmaster-Tools-Intents-Topics-Citation-Share-Compare)
- [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots)
- [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)

**Check for product marketing context first:**
If `.agents/product-marketing.md` exists (or `.claude/product-marketing.md`, or the legacy `product-marketing-context.md` filename, in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Gather this context (ask if not provided):

### 1. Current AI Visibility

- Do you know if your brand appears in AI-generated answers today?
- Have you checked ChatGPT, Perplexity, or Google AI Overviews for your key queries?
- What queries matter most to your business?

### 2. Content & Domain

- What type of content do you produce? (Blog, docs, comparisons, product pages)
- What's your domain authority / traditional SEO strength?
- Do you have existing structured data (schema markup)?

### 3. Goals

- Get cited as a source in AI answers?
- Appear in Google AI Overviews for specific queries?
- Compete with specific brands already getting cited?
- Optimize existing content or create new AI-optimized content?

### 4. Competitive Landscape

- Who are your top competitors in AI search results?
- Are they being cited where you're not?

---

## How AI Search Works

### The AI Search Landscape

| Platform              | Confirmed operating context                                                 | Measurement starting point                         |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| **Google AI Search**  | Uses core Search ranking and quality systems; indexed/snippet-eligible page | Search Console Generative AI report when available |
| **ChatGPT search**    | Uses web search and cites sources; crawler roles are separated by purpose   | Referral data + representative prompt checks       |
| **Perplexity**        | Provides linked sources and documents its search/user crawlers              | Referral data + representative prompt checks       |
| **Copilot / Bing AI** | Uses Bing search infrastructure and reports citation activity               | Bing Webmaster Tools AI Performance                |
| **Claude**            | Search and user-action access have distinct documented crawlers             | Referral data + representative prompt checks       |

For per-provider crawler roles, access verification, and measurement checklists, see [references/platform-ranking-factors.md](references/platform-ranking-factors.md).

### Key Difference from Traditional SEO

Traditional search commonly exposes ranked links. AI search can additionally retrieve, synthesize, and **cite** passages. These are connected surfaces, not independent games.

Do not assume a fixed organic rank-to-citation relationship across platforms. Measure discovery, citations, referrals, and the resulting user action separately.

### Google's Official Stance vs. Multi-Platform Reality

This is important to read once before doing anything else.

**Google's position** ([AI features optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)):

> "The best practices for SEO continue to be relevant because our generative AI features on Google Search are rooted in our core Search ranking and quality systems."

Google explicitly says:

- **No special markup or files are required** for AI Overviews or AI Mode
- **Don't chunk content for AI** — write for people, organize with normal headings and paragraphs
- **Don't write separate content for AI** — that risks "scaled content abuse" spam policy
- **Helpful, reliable, people-first content** wins — same E-E-A-T standards as regular Search
- **A Generative AI performance report exists for eligible Search Console properties** — it is being rolled out and does not replace the standard Performance report

**Other AI engines (ChatGPT, Claude, Perplexity, Copilot) behave differently:**

- Their source-selection details and reporting surfaces differ, and crawler roles must be checked in first-party documentation.
- Clear headings, direct claims, tables, and visible evidence can make content easier for people and machines to interpret, but there is no universal passage template or guaranteed citation format.
- Do not claim that a platform consumes `llms.txt` or another auxiliary file unless that platform documents the behavior.

**What this means for the work:**

- Use definitions, comparisons, steps, and Q&A only where they make the page clearer for its intended reader. There is no universally optimal answer-block length.
- For Google AI Overviews / AI Mode specifically: optimize for people and core Search. Prioritize first-hand, reliable information, semantic HTML, and clean indexability.
- For other platforms: verify access, publish clear and attributable source material, then measure actual citations and referrals before layering on optional files.

When in doubt, default to "write for people, organize for clarity," then verify platform-specific access and measurement.

### Query Fan-Out (Google AI Search)

Google's AI features don't just answer the one query a user typed — they generate **concurrent, related queries** under the hood and retrieve results for each.

Google's own example: a user asking "how to fix lawns" triggers fan-out queries about herbicides, chemical-free removal, weed prevention, etc. The AI synthesizes across all of them.

**Implications:**

- A literal page for every keyword variant is unnecessary. Start from the reader's task and the site's existing information architecture.
- Cover related questions when they are part of the reader's task. Do not manufacture thin pages for every inferred fan-out query.
- Use the site's content map to decide whether one clear page or a small linked cluster best serves the topic.

**Action**: when planning content, identify the related questions needed to complete the reader's task. Cover them on one clear page or a small linked set, based on depth and navigation rather than a fixed count.

---

## AI Visibility Audit

Before optimizing, assess your current AI search presence.

### Step 1: Check AI Answers for Your Key Queries

Select a small, stable sample of important queries and check only the platforms relevant to the audience:

| Query     | Google AI Overview | ChatGPT | Perplexity | You Cited? | Competitors Cited? |
| --------- | :----------------: | :-----: | :--------: | :--------: | :----------------: |
| [query 1] |       Yes/No       | Yes/No  |   Yes/No   |   Yes/No   |       [who]        |
| [query 2] |       Yes/No       | Yes/No  |   Yes/No   |   Yes/No   |       [who]        |

Include the mix present in the site's query map: definitions, implementation tasks, comparisons, troubleshooting, local or product decisions, and branded queries where applicable.

### Step 2: Analyze Citation Patterns

When your competitors get cited and you don't, examine:

- **Intent fit** — Does their page answer the actual task more completely?
- **Evidence** — Do they show first-hand work, primary sources, dates, and limitations?
- **Freshness accuracy** — Is time-sensitive information current rather than merely carrying a new date?
- **Technical access** — Is the canonical page indexable and available to the relevant search crawler?
- **Independent context** — Do legitimate third-party sources corroborate the entity or claim?

### Step 3: Content Extractability Check

For each priority page, verify:

| Check                                                         | Pass/Fail |
| ------------------------------------------------------------- | --------- |
| The page answers its reader's task early and clearly?         |           |
| Key claims retain meaning when quoted with their source?      |           |
| Time-sensitive facts include dates and primary sources?       |           |
| Comparison tables for "[X] vs [Y]" queries?                   |           |
| Q&A section where the reader genuinely needs one?             |           |
| Accurate schema supported for this page type?                 |           |
| Expert attribution (author name, credentials)?                |           |
| Freshness is appropriate for this subject and honestly dated? |           |
| Heading structure matches query patterns?                     |           |
| Crawler policy matches the site's search/training decisions?  |           |

### Step 4: AI Bot Access Check

Verify crawler policy by purpose instead of treating "AI bots" as one category:

| Provider   | Search / citation              | Training                                                                                   | User-requested access       |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------- |
| OpenAI     | `OAI-SearchBot`                | `GPTBot`                                                                                   | `ChatGPT-User`              |
| Anthropic  | `Claude-SearchBot`             | `ClaudeBot`                                                                                | `Claude-User`               |
| Perplexity | `PerplexityBot`                | Documented as not used for foundation-model training                                       | `Perplexity-User`           |
| Google     | Google Search uses `Googlebot` | `Google-Extended` controls specified Gemini uses and does not affect Google Search ranking | Check service-specific docs |
| Microsoft  | `Bingbot` for Bing Search      | Check current policy                                                                       | Check service-specific docs |

Check first-party crawler documentation before writing rules because names and roles can change. A robots.txt rule controls crawling, not guaranteed removal from an index; use the appropriate search removal or `noindex` mechanism when exclusion itself is the goal.

See [references/platform-ranking-factors.md](references/platform-ranking-factors.md) for the per-provider crawler tables and the robots.txt policy checklist.

---

## Optimization Strategy

### The Three Pillars

```
1. Structure (make the reader's task clear)
2. Evidence (make claims verifiable)
3. Distribution (be discoverable where the audience looks)
```

### Pillar 1: Structure — Make Content Extractable

Search and answer systems can retrieve or quote passages from a page. Make key claims understandable with their attribution and necessary context.

**Content block patterns:**

- **Definition blocks** for "What is X?" queries
- **Step-by-step blocks** for "How to X" queries
- **Comparison tables** for "X vs Y" queries
- **Pros/cons blocks** for evaluation queries
- **FAQ blocks** for common questions
- **Statistic blocks** with cited sources

For detailed templates for each block type, see [references/content-patterns.md](references/content-patterns.md).

**Structural rules:**

- Answer the section's question early when a direct answer helps the reader
- Make key claims self-contained enough to understand without forcing them into a fixed word count
- Use H2/H3 headings that match how people phrase queries
- Use tables when readers need exact comparisons
- Use numbered lists when order matters
- Each paragraph should convey one clear idea

### Pillar 2: Authority — Make Content Citable

Build evidence a reader can inspect. The Princeton GEO research (KDD 2024) is useful as a controlled experiment showing that source citation, quotations, statistics, clarity, and fluency can affect answer-engine visibility in that benchmark. Do not convert its percentages into promised production lifts or universal platform rules.

**Statistics and data**

- Include specific numbers with sources
- Cite original research, not summaries of research
- Add dates to all statistics
- Explain the population, period, and limitations when they affect interpretation

**Expert attribution**

- Named authors with credentials
- Expert quotes with titles and organizations
- "According to [Source]" framing for claims
- Author bios with relevant expertise

**Freshness signals**

- "Last updated: [date]" prominently displayed
- Review on a cadence appropriate to how quickly the subject changes
- Keep current references where recency affects correctness
- Remove or update outdated information

**E-E-A-T alignment**

- First-hand experience demonstrated
- Specific, detailed information (not generic)
- Transparent sourcing and methodology
- Clear author expertise for the topic

### Pillar 3: Distribution — Be Discoverable Where the Audience Looks

Search and answer products may use first-party pages, videos, forums, reviews, news, and other independent sources. The mix changes by query and platform; a third-party citation-share snapshot is not a universal optimization target.

- Keep owned profiles and public facts accurate and consistent
- Participate in relevant communities because the participation itself helps people
- Earn independent coverage through useful work, evidence, and expertise
- Publish video, documentation, or data only where the audience benefits from that format
- Never manufacture Wikipedia, review, forum, or guest-post mentions for ranking or citation manipulation

### Machine-Readable Files for AI Agents

> **Google's stance**: not required for AI Overviews or AI Mode. Their guide explicitly says you don't need new markup, AI files, or markdown to appear in generative AI search.
>
> **Why consider them anyway**: an auxiliary machine-readable file can be useful when a named consumer documents or demonstrates that it reads the file. Treat this as an interoperability experiment with an owner and measurement plan, not as a ranking requirement.

Public, semantic HTML remains the primary source of truth. Pricing, specifications, dates, authors, and contact paths should be visible there when they matter to the user. Do not create a parallel Markdown copy unless a named consumer documents the format and the copy can be generated from the same source without freshness drift.

**`/llms.txt`** — A proposal for linking AI-readable context (see [the proposal repository](https://github.com/AnswerDotAI/llms-txt))

`llms.txt` is not an IETF or W3C standard, and Google Search explicitly ignores it for visibility and ranking. Add it only when navigation for a named consumer is useful, generate it from the same content source when practical, and do not promise ranking or citation gains.

Open Knowledge Format (OKF) is a Google Cloud Knowledge Catalog interchange format for data-team knowledge, not a documented Google Search or AI-citation protocol. Do not deploy an `/okf/` marketing-site bundle as an SEO tactic. See [references/okf.md](references/okf.md) only when the user specifically asks about that format.

### Structured Data

Structured data describes visible content for documented consumers.

Use schema when it accurately represents visible content and supports a known search feature or data consumer. Google says structured data is not required for generative AI search and no AI-specific schema exists. It can support ordinary rich-result eligibility, but it does not guarantee display, ranking, or citation. For implementation, use the **schema** skill.

---

## Agentic Experiences

Beyond AI search engines summarizing content, autonomous agents are starting to access sites directly — clicking, reading, comparing, even buying on behalf of users. Google's guide flags this as an emerging category to plan for.

**How agents access your site:**

- **Visual rendering** — they screenshot/read the page like a user would
- **DOM inspection** — they parse the page's HTML structure
- **Accessibility tree** — they rely on the same semantic information assistive tech uses (labels, roles, landmarks, headings)

**What to do:**

- **Render meaningful content reliably** — verify what the browser, DOM, accessibility tree, and relevant crawler can actually access
- **Semantic HTML** — use `<main>`, `<nav>`, `<article>`, `<button>`, proper heading hierarchy, `alt` text on images
- **Clean accessibility tree** — every interactive element labelled; ARIA used correctly (or not at all when native HTML suffices)
- **Predictable interactions** — use native controls, durable labels, and state that remains understandable after rerendering
- **Visible pricing, specs, contact info** — anything a person or agent needs for the task should be on the public source-of-truth page

**Emerging — Universal Commerce Protocol (UCP):**
Google announced UCP in 2026 and has been expanding it (catalog discovery, cart, checkout integrations) with early retail adopters. For commerce sites, check Google's current first-party UCP documentation for adoption status before advising on it; the structural recommendations above remain the foundation either way.

For ecom and local business specifically, Google highlights:

- **Merchant Center feeds** + **Google Business Profile** for product/service visibility in AI Search
- **Business Agent** for conversational customer engagement (where applicable)

---

## Content Formats Worth Testing

Choose a format from the reader's task rather than an industry-wide citation-share table:

- Comparisons for an actual decision with explicit criteria
- How-to material with prerequisites, steps, and verified outcomes
- Original research with methodology and downloadable data where appropriate
- Product or service facts with current terms and limitations
- First-hand analysis that adds something not already available

Generic summaries, unsupported marketing claims, inaccessible primary material, and stale facts are weak sources for people and machines alike.

**Citation ≠ recommendation.** A page may be cited for useful facts without its brand being recommended for the user's requirements. Measure shown, cited, mentioned, recommended, visited, and acted-upon outcomes separately; do not infer one from another. See [references/citations-vs-recommendations.md](references/citations-vs-recommendations.md).

---

## Monitoring AI Visibility

### What to Track

| Observation          | What It Measures                                                                                    | How to Check                                       |
| -------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Search visibility    | Impressions, pages, queries, countries, and devices                                                 | Google Search Console / Bing Search Performance    |
| Google AI visibility | Pages shown in Google's generative AI features                                                      | Search Console Generative AI report when available |
| Bing AI citations    | Citations, cited pages, sampled queries, intent/topic labels, citation share, and period comparison | Bing Webmaster Tools AI Performance                |
| Citation sample      | Whether a representative answer cited a canonical page                                              | Dated manual or tool-assisted prompt sample        |
| Mention framing      | Whether the entity was absent, neutral, qualified, or recommended                                   | Dated sample with the exact requirements           |
| Referral             | A visit attributed to a known AI surface                                                            | Site analytics with attribution limits stated      |
| User outcome         | The action visibility was meant to support                                                          | Site or business outcome data                      |

### Third-Party Monitoring Tools

Vendor coverage and platform behavior change quickly. Before adoption, verify:

- exact surfaces, countries, accounts, models, and collection dates
- whether the tool stores prompts or customer data
- how repetitions, personalization, and non-determinism are handled
- exportability and a reproducible sampling method
- whether a proprietary score can be decomposed into direct observations

Use these tools as sampling and workflow aids. No vendor has access to a search engine's private ranking or AI systems.

### DIY Monitoring (No Tools)

At a cadence appropriate to the site's publishing frequency and impact:

1. Select a small, stable sample from the site's important query map.
2. Check only the search or answer surfaces used by the intended audience.
3. Record date, locale, account/device state, exact query, cited canonical URL, and answer framing.
4. Keep unavailable data as unavailable, not zero.
5. Compare with first-party console data and downstream user behavior.

### First-party reporting expectations

Google is rolling out a **Generative AI performance report** to eligible Search Console properties. Continue using the standard Performance, Indexing, and Core Web Vitals reports because the dedicated report is an additional view, not a replacement.

Bing Webmaster Tools **AI Performance** provides citation activity for Microsoft Copilot, Bing AI experiences, and selected integrations. Its preview also groups sampled grounding queries by intent and topic, reports citation share for a query, and compares periods. Microsoft notes that citation counts and citation share do not indicate placement, authority, traffic share, importance, or rank; intent/topic labels are evolving AI classifications. Measure them as observational evidence of source use and context, alongside search visibility and downstream user behavior.

No first-party console provides a complete cross-platform view. Use representative prompt checks and third-party tools as samples, and label their limits.

---

## What NOT to Do

Google's guide says these tactics are unnecessary or unsupported for Google Search. Manipulative use may also conflict with Search spam policies.

1. **Write separate content only to manipulate AI responses**. Serve the reader's task. Scaled, low-value variants created to manipulate Search can violate the scaled content abuse policy.
2. **Chunk pages into AI-bait fragments**. Google says there is no requirement to split content into tiny pieces for AI understanding. Use normal paragraphs and headings that help readers.
3. **Generate at scale for ranking manipulation**. AI-generated content is fine _if_ it meets Search Essentials and spam policies. Mass-producing thin variations does not.
4. **Pursue inauthentic mentions**. Don't fabricate citations or bulk-spam Reddit/Wikipedia for AI visibility. Real participation only.
5. **Copy one crawler policy across different purposes**. Search/citation, training, and user-requested access can use different crawlers. Decide each purpose separately and verify current first-party documentation.
6. **Make the canonical content inaccessible without a fragile interaction**. Verify the rendered page, DOM, accessibility tree, and relevant crawler access.
7. **Hide who produced a claim or where it came from**. First-hand experience, authorship, sourcing, and limitations help people assess reliability.

---

## AI SEO by Content Type

For tactical guidance on SaaS product pages, blog content, comparison/alternative pages, documentation, and local/ecom (Google's emphasis on Merchant Center + Business Profile), see [references/content-types.md](references/content-types.md).

---

## Common Mistakes

- **Ignoring new discovery surfaces entirely** — include AI search in measurement when it matters to the audience, without replacing conventional search and user outcomes
- **Treating AI SEO as separate from SEO** — Good traditional SEO is the foundation; AI SEO adds structure and authority on top
- **Writing for AI, not humans** — content built around speculative extraction patterns can make the reader's task worse without producing a measurable benefit
- **Misleading freshness signals** — show a modification date only when the page changed materially, and update time-sensitive facts on an appropriate cadence
- **Gating the only useful version** — if discovery matters, keep a meaningful public source while reserving genuinely private material for gated access
- **Manufacturing third-party presence** — independent references help only when they are legitimate and relevant
- **Using inaccurate structured data** — schema must match visible content and a real page type; more markup is not automatically better
- **Generalizing benchmark results** — a controlled GEO experiment is not a guaranteed production traffic or citation lift
- **Hiding decision-critical facts in an inaccessible interface** — use accessible, semantic HTML and explain genuinely variable terms instead of inventing an undocumented mirror format
- **Conflating crawler roles** — for example, `GPTBot` is training-related while `OAI-SearchBot` is the documented OpenAI search crawler
- **Unsupported generic claims** — replace "we're the best" with first-hand evidence a reader can verify; do not promise that adding a number causes citation
- **Forgetting to monitor** — set a cadence that matches publishing frequency and business impact; monthly is a useful starting point, not a universal law

---

## Task-Specific Questions

1. Which small set of queries best represents the site's intended audience and tasks?
2. Have you checked if AI answers exist for those queries today?
3. Do you have structured data (schema markup) on your site?
4. What content types do you publish? (Blog, docs, comparisons, etc.)
5. Are competitors being cited by AI where you're not?
6. Which legitimate third-party sources shape how this topic or entity is understood?

---

## Related Skills

- **seo-audit**: For traditional technical and on-page SEO audits
- **schema**: For implementing accurate structured data for documented consumers and rich-result eligibility
- **cro**: For ensuring AI-discoverable pages still guide human readers toward consultation
