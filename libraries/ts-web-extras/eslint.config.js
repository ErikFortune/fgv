// ESLint 9 flat config
const nodeProfile = require('@rushstack/eslint-config/flat/profile/node');
const packletsPlugin = require('@rushstack/eslint-config/flat/mixins/packlets');
const tsdocPlugin = require('@rushstack/eslint-config/flat/mixins/tsdoc');

module.exports = [
  ...nodeProfile,
  packletsPlugin,
  ...tsdocPlugin,
  {
    rules: {
      '@rushstack/packlets/mechanics': 'warn'
    }
  },
  {
    // file-api-types/ deliberately mirrors the browser File System Access API.
    // Interface names match the DOM verbatim (no `I` prefix) and some APIs return `null`.
    files: ['src/packlets/file-api-types/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      '@rushstack/no-new-null': 'off'
    }
  },
  {
    // MockStorage implements the browser Storage interface (localStorage), which
    // declares `getItem(key)` and `key(index)` as returning `string | null`.
    files: ['src/test/unit/localStorageTreeAccessors.test.ts'],
    rules: {
      '@rushstack/no-new-null': 'off'
    }
  }
];
