// Setup file for Jest tests
// Required for ts-utils which uses TextEncoder/TextDecoder

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Extend jest matchers (toBeInTheDocument, etc.)
require('@testing-library/jest-dom');

// Suppress console output in tests by providing a no-op logger
global.testLogger = () => {};
global.console = {
  ...console,
  log: global.testLogger,
  warn: global.testLogger,
  error: console.error // Keep error for actual test failures
};
