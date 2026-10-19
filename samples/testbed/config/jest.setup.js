// Setup file for Jest tests.
// Polyfills + matchers shared across the testbed test suite.

// Polyfill TextEncoder / TextDecoder for jsdom (ts-utils uses them).
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// jsdom's built-in `crypto` lacks `subtle` (Web Crypto API), which
// `BrowserCryptoProvider` (@fgv/ts-web-extras) requires. Swap in Node's own
// webcrypto implementation, matching @fgv/ts-web-extras's own jest setup.
if (typeof globalThis.crypto?.subtle === 'undefined') {
  const { webcrypto } = require('crypto');
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true
  });
}

// jsdom's `Blob`/`File` implementation (this jsdom version) has no `.text()` — real
// browsers do. Polyfill it via `FileReader`, which jsdom does implement, so
// KeyStore-import tests can exercise the real `File.text()` call path used in production.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function polyfilledBlobText() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(this);
    });
  };
}

// jsdom's `AbortSignal` lacks the static `.timeout()` factory (real browsers and
// Node both have it). The structured-output probe scenario uses it to bound a live
// provider call, so tests that exercise `runProbe` need it available.
if (typeof AbortSignal.timeout !== 'function') {
  AbortSignal.timeout = function timeout(milliseconds) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(new DOMException('The operation timed out.', 'TimeoutError'));
    }, milliseconds);
    // Never let a pending timeout keep the test process alive.
    timer.unref?.();
    return controller.signal;
  };
}

// jsdom does not provide `structuredClone` (Node >= 17 and current browsers do). @fgv/ts-agent-tasks
// clones authorization requests, projections and checkpoint records with it — a policy check that
// throws is a denial, so without it every agent-tasks operation is refused under jsdom. Expose
// Node's structured-clone algorithm through v8 serialization.
if (typeof globalThis.structuredClone !== 'function') {
  const v8 = require('v8');
  globalThis.structuredClone = (value) => v8.deserialize(v8.serialize(value));
}

// jest-dom matchers (toBeInTheDocument, etc.)
require('@testing-library/jest-dom');
