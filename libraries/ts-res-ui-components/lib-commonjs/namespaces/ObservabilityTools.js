'use strict';
/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.TestObservabilityContext =
  exports.DefaultObservabilityContext =
  exports.createNoOpObservabilityContext =
  exports.createConsoleObservabilityContext =
  exports.ObservabilityContext =
  exports.NoOpUserLogger =
  exports.ConsoleUserLogger =
    void 0;
var observability_1 = require('../utils/observability');
Object.defineProperty(exports, 'ConsoleUserLogger', {
  enumerable: true,
  get: function () {
    return observability_1.ConsoleUserLogger;
  }
});
Object.defineProperty(exports, 'NoOpUserLogger', {
  enumerable: true,
  get: function () {
    return observability_1.NoOpUserLogger;
  }
});
Object.defineProperty(exports, 'ObservabilityContext', {
  enumerable: true,
  get: function () {
    return observability_1.ObservabilityContext;
  }
});
Object.defineProperty(exports, 'createConsoleObservabilityContext', {
  enumerable: true,
  get: function () {
    return observability_1.createConsoleObservabilityContext;
  }
});
Object.defineProperty(exports, 'createNoOpObservabilityContext', {
  enumerable: true,
  get: function () {
    return observability_1.createNoOpObservabilityContext;
  }
});
Object.defineProperty(exports, 'DefaultObservabilityContext', {
  enumerable: true,
  get: function () {
    return observability_1.DefaultObservabilityContext;
  }
});
Object.defineProperty(exports, 'TestObservabilityContext', {
  enumerable: true,
  get: function () {
    return observability_1.TestObservabilityContext;
  }
});
//# sourceMappingURL=ObservabilityTools.js.map
