// Setup file for Jest tests
// Required for ts-utils which uses TextEncoder/TextDecoder

// Polyfill TextEncoder and TextDecoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock File constructor for browser file operations
global.File = class MockFile {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.type = options.type || '';
    this.webkitRelativePath = options.webkitRelativePath || '';
  }
};

// Mock FileReader for file reading operations
global.FileReader = class MockFileReader {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }

  readAsText(file) {
    setTimeout(() => {
      if (this.onload) {
        this.result = file.bits ? file.bits[0] : '';
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
};

// Mock Blob for export operations
global.Blob = class MockBlob {
  constructor(bits, options = {}) {
    this.bits = bits;
    this.type = options.type || '';
  }
};

// Mock URL for createObjectURL/revokeObjectURL
global.URL = {
  createObjectURL: jest.fn(() => 'mock-blob-url'),
  revokeObjectURL: jest.fn()
};

// Extend jest matchers (toBeInTheDocument, etc.)
require('@testing-library/jest-dom');

// Mock document methods for file export
global.document = {
  createElement: jest.fn(() => ({
    href: '',
    download: '',
    click: jest.fn()
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};
