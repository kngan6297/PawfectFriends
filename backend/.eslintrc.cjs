module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['import'],
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  rules: {
    'import/no-commonjs': 'error', // ❌ Cấm dùng require/module.exports
    'import/prefer-default-export': 'off',
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    // Custom security rules for environment variables
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'MemberExpression[object.name="process"][property.name="env"][computed=false]',
        message:
          '❌ SECURITY: Use process.env.VAR_NAME instead of process.env["VAR_NAME"] for better security validation',
      },
    ],
    // Prevent direct access to sensitive environment variables without validation
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message:
          '❌ SECURITY: Access environment variables through validated config objects, not directly from process.env',
      },
    ],
  },
  // Custom rule for more specific environment variable validation
  overrides: [
    {
      files: ['**/*.js'],
      rules: {
        'no-restricted-properties': [
          'error',
          {
            object: 'process',
            property: 'env',
            message:
              '❌ SECURITY: Access environment variables through validated config objects, not directly from process.env',
          },
        ],
      },
    },
  ],
};
