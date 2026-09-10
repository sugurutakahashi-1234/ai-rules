---
name: web-design-guidelines
description: Review implemented UI code against Vercel's current Web Interface Guidelines. Use for broad UI or UX code review. For a focused WCAG audit use accessibility; for measured site-wide quality use web-quality-audit.
metadata:
  author: vercel
  version: "1.0.0"
  source: https://github.com/vercel-labs/web-interface-guidelines
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines
> 由来: vercel-labs/web-interface-guidelines（MIT）。上流から派生して独自に管理する。上流には追従しない（上位互換の点検は skills-review スキル）。


Review files for compliance with Web Interface Guidelines.

## How It Works

1. Fetch the latest guidelines from the source URL below
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the fetched guidelines
4. Output findings in the terse `file:line` format

## Guidelines Source

Fetch fresh guidelines before each review:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use an available web retrieval tool to fetch the latest rules. The fetched content contains all the rules and output format instructions.

## Usage

When a user provides a file or pattern argument:

1. Fetch guidelines from the source URL above
2. Read the specified files
3. Apply all rules from the fetched guidelines
4. Output findings using the format specified in the guidelines

If no files specified, ask the user which files to review.
