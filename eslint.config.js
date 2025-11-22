// ESLint flat config with ignores to replace deprecated .eslintignore.
// Adjust the paths in `ignores` to match files you want ESLint to skip.
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "test/**",
      "tests/**",
      "**/*.test.*",
      "**/__tests__/**",
      ".next/**"
    ]
  },
  // If you already have existing config (like extends/rules), add them below.
  // Example minimal config to keep your current settings working:
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module"
    },
    // extend your existing configs here if needed, e.g.:
    // extends: ["plugin:@typescript-eslint/recommended", "next/core-web-vitals"],
    // rules: {...}
  }
];