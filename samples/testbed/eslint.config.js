// ESLint 9 flat config
const nodeProfile = require('@rushstack/eslint-config/flat/profile/node');
const packletsPlugin = require('@rushstack/eslint-config/flat/mixins/packlets');
const tsdocPlugin = require('@rushstack/eslint-config/flat/mixins/tsdoc');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

module.exports = [
  ...nodeProfile,
  packletsPlugin,
  ...tsdocPlugin,
  {
    plugins: {
      'react-hooks': reactHooksPlugin
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      '@rushstack/packlets/mechanics': 'warn',
      '@rushstack/no-new-null': 'off'
    }
  }
];
