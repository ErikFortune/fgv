// ESLint 9 flat config for chocolate-lab-api
const nodeProfile = require('@rushstack/eslint-config/flat/profile/node');
const packletsPlugin = require('@rushstack/eslint-config/flat/mixins/packlets');
const tsdocPlugin = require('@rushstack/eslint-config/flat/mixins/tsdoc');

module.exports = [
  ...nodeProfile,
  packletsPlugin,
  ...tsdocPlugin,
  {
    rules: {
      '@rushstack/packlets/mechanics': 'warn',

      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          filter: {
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
