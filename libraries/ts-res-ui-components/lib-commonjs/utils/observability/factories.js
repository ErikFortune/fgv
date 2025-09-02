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
exports.TestObservabilityContext = exports.DefaultObservabilityContext = void 0;
exports.createConsoleObservabilityContext = createConsoleObservabilityContext;
exports.createNoOpObservabilityContext = createNoOpObservabilityContext;
const ts_utils_1 = require('@fgv/ts-utils');
const implementations_1 = require('./implementations');
/**
 * Creates a console-based observability context for development and debugging.
 * @param diagLogLevel - Log level for diagnostic messages.
 * @param userLogLevel - Log level for user messages.
 * @returns A new observability context with console loggers.
 * @public
 */
function createConsoleObservabilityContext(diagLogLevel = 'info', userLogLevel = 'info') {
  const diag = new ts_utils_1.Logging.ConsoleLogger(diagLogLevel);
  const user = new implementations_1.ConsoleUserLogger(userLogLevel);
  return new implementations_1.ObservabilityContext(diag, user);
}
/**
 * Creates a no-op observability context that suppresses all logging.
 * @param diagLogLevel - Log level for diagnostic messages.
 * @param userLogLevel - Log level for user messages.
 * @returns A new observability context with no-op loggers.
 * @public
 */
function createNoOpObservabilityContext(diagLogLevel = 'silent', userLogLevel = 'silent') {
  const diag = new ts_utils_1.Logging.NoOpLogger(diagLogLevel);
  const user = new implementations_1.NoOpUserLogger(userLogLevel);
  return new implementations_1.ObservabilityContext(diag, user);
}
/**
 * Default console-only observability context for general use.
 * @public
 */
exports.DefaultObservabilityContext = createConsoleObservabilityContext('info', 'info');
/**
 * Test observability context with no-op loggers.
 * @public
 */
exports.TestObservabilityContext = createNoOpObservabilityContext();
//# sourceMappingURL=factories.js.map
