// コミット規約: type は英語小文字・subject と body は日本語。
// 正本は sugurutakahashi-1234/ai-rules の rules/language-and-commits.md。
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "add",
        "remove",
        "rename",
        "tweak",
        "tune",
        "refactor",
        "docs",
        "ci",
        "chore",
        "test",
      ],
    ],
    "subject-case": [0],
    "header-max-length": [2, "always", 120],
    "body-max-line-length": [0],
  },
};
