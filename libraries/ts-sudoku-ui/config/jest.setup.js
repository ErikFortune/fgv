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

// Setup ts-utils-jest matchers for Result pattern testing
require('@fgv/ts-utils-jest');

// Suppress console output in tests by providing a no-op logger
// This affects both direct console calls and components that use logger dependency injection
global.testLogger = () => {}; // No-op logger for tests
global.console = {
  ...console,
  log: global.testLogger,
  warn: global.testLogger,
  error: console.error // Keep error for actual test failures
};
