// コミット規約: type は英語小文字・subject と body は日本語。
// 正本は sugurutakahashi-1234/ai-rules の rules/language-and-commits.md。
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // 全社標準の語彙（Conventional Commits 準拠 + improve）。
    // release-please がこの語彙に依存するリポジトリがあるため勝手に増減しない
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "improve",
      ],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 120],
    "body-max-line-length": [0],
  },
};
