// Setup file for Jest tests
// Required for ts-utils which uses TextEncoder/TextDecoder

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Setup React act environment before anything else
global.IS_REACT_ACT_ENVIRONMENT = true;

// Setup DOM environment properly for jsdom BEFORE importing React Testing Library
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'node.js',
    clipboard: {
      writeText: jest.fn(() => Promise.resolve())
    }
  },
  writable: true
});

// Ensure DOM structure exists and is valid
function ensureValidDOM() {
  // Make sure we have a valid document structure
  if (!document.documentElement) {
    const html = document.createElement('html');
    document.appendChild(html);
  }

  if (!document.body) {
    const body = document.createElement('body');
    document.documentElement.appendChild(body);
  }

  // Clear any existing content but preserve the structure
  document.body.innerHTML = '';

  // Add basic attributes that React might expect
  document.body.setAttribute('id', 'test-root');
}

// Setup the DOM structure immediately
ensureValidDOM();

// Now import and configure React Testing Library
const { configure, cleanup } = require('@testing-library/react');

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 1000,
  computedStyleSupportsPseudoElements: false
});

// Setup Jest matchers AFTER DOM setup
require('@testing-library/jest-dom');
require('@fgv/ts-utils-jest');

// Setup beforeEach and afterEach to properly manage DOM state between tests
beforeEach(() => {
  // Ensure DOM is clean and valid before each test
  ensureValidDOM();
});

afterEach(() => {
  // Clean up React Testing Library after each test
  cleanup();

  // Clean up DOM state
  if (document.body) {
    document.body.innerHTML = '';
  }
});

// Setup window.URL for SudokuGridEntry tests
global.URL = {
  createObjectURL: jest.fn(() => 'mock-url'),
  revokeObjectURL: jest.fn()
};

// Suppress console output in tests by providing a no-op logger
// This affects both direct console calls and components that use logger dependency injection
global.testLogger = () => {}; // No-op logger for tests

// Suppress console output in tests by providing a no-op logger
// This affects both direct console calls and components that use logger dependency injection
global.console = {
  ...console,
  log: global.testLogger,
  warn: global.testLogger,
  error: console.error // Keep error for actual test failures
};
