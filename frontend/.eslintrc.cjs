module.exports = {
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "import"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "import/no-commonjs": "error",
    "react/prop-types": "off",
    "import/order": [
      "warn",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    // Custom security rules for environment variables
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "MemberExpression[object.metaProperty=true][object.property.name='env'][property.name=/^(?!VITE_).*/]",
        message:
          "❌ SECURITY: Only VITE_ prefixed environment variables are allowed in import.meta.env. Use import.meta.env.VITE_* instead.",
      },
      {
        selector:
          "MemberExpression[object.metaProperty=true][object.property.name='env'][property.name=/^VITE_.*(SECRET|TOKEN|KEY|PASSWORD)$/i]",
        message:
          "❌ SECURITY: VITE_* variables containing SECRET, TOKEN, KEY, or PASSWORD are not allowed. These should be handled server-side only.",
      },
    ],
    // Additional security rule for process.env usage (should not exist in frontend)
    "no-restricted-globals": [
      "error",
      {
        name: "process",
        message:
          "❌ SECURITY: process.env should not be used in frontend code. Use import.meta.env.VITE_* instead.",
      },
    ],
  },
  // Custom rule for more specific environment variable validation
  overrides: [
    {
      files: ["**/*.{ts,tsx,js,jsx}"],
      rules: {
        "no-restricted-properties": [
          "error",
          {
            object: "import.meta.env",
            property: /^(?!VITE_).*/,
            message:
              "❌ SECURITY: Only VITE_ prefixed environment variables are allowed in import.meta.env",
          },
        ],
      },
    },
  ],
};
