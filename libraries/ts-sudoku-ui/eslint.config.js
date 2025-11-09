// ESLint 9 flat config
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
      // Disable no-new-null rule for React components where null is conventional
      '@rushstack/no-new-null': 'off'
    }
  }
];
