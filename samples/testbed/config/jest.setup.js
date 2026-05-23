// Setup file for Jest tests.
// Polyfills + matchers shared across the testbed test suite.

// Polyfill TextEncoder / TextDecoder for jsdom (ts-utils uses them).
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// jest-dom matchers (toBeInTheDocument, etc.)
require('@testing-library/jest-dom');
