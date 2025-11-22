// Flat ESLint config for ESLint v9+
// Minimal working config to parse TypeScript + JSX, with common plugins.
// Adjust rules/extends to taste once this is working.
module.exports = [
  // 1) Ignore patterns (first config entry can be used for ignores)
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "**/*.test.*",
      "**/__tests__/**"
    ]
  },

  // 2) Main config: parser, parserOptions, plugins and base rules
  {
    languageOptions: {
      parser: require.resolve("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
        // If you want type-aware rules, add:
        // project: "./tsconfig.json"
      },
      globals: {
        JSX: "readonly"
      }
    },

    settings: {
      react: { version: "detect" }
    },

    // load plugin implementations (they must be installed)
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
      react: require("eslint-plugin-react"),
      "react-hooks": require("eslint-plugin-react-hooks"),
      "jsx-a11y": require("eslint-plugin-jsx-a11y")
    },

    // basic rules; keep many rules permissive while we get parsing working
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "react/react-in-jsx-scope": "off"
    }
  }
];
