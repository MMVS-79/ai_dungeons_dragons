// Flat ESLint config for ESLint v9+ (corrected: pass parser module object, not a path)
module.exports = [
  {
    // ignore common build/test folders
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

  {
    // languageOptions.parser must be the parser module object (not a string).
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
        // If you need type-aware rules, add: project: "./tsconfig.json"
      },
      globals: {
        JSX: "readonly"
      }
    },

    settings: {
      react: { version: "detect" }
    },

    // Provide plugin implementations (must be installed)
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
      react: require("eslint-plugin-react"),
      "react-hooks": require("eslint-plugin-react-hooks"),
      "jsx-a11y": require("eslint-plugin-jsx-a11y")
    },

    // Basic rules to allow parsing + useful checks; adjust as needed
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "react/react-in-jsx-scope": "off"
    }
  }
];

