// ESLint 9 flat config for ts-utils
const nodeProfile = require('@rushstack/eslint-config/flat/profile/node');
const packletsPlugin = require('@rushstack/eslint-config/flat/mixins/packlets');
const tsdocPlugin = require('@rushstack/eslint-config/flat/mixins/tsdoc');

module.exports = [
  ...nodeProfile,
  packletsPlugin,
  ...tsdocPlugin,
  {
    // Override specific rules if needed
    rules: {
      '@rushstack/packlets/mechanics': 'warn',

      // Tighten naming conventions for interface properties
      '@typescript-eslint/naming-convention': [
        'warn',
        // Keep all the base rules from rushstack but add stricter property rules
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          filter: {
            // Only allow quoted identifiers that truly need special chars (not just hyphens)
            regex: '^__',
            match: false
          }
        },
        {
          selector: 'method',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow'
        }
      ]
    }
  }
];
