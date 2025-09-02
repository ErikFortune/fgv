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
exports.ObservabilityContext = exports.NoOpUserLogger = exports.ConsoleUserLogger = void 0;
const ts_utils_1 = require('@fgv/ts-utils');
/**
 * Console-based user logger that extends diagnostic logging with success method.
 * @public
 */
class ConsoleUserLogger extends ts_utils_1.Logging.LoggerBase {
  /**
   * Creates a new console user logger.
   * @param logLevel - The level of logging to be used.
   */
  constructor(logLevel) {
    super(logLevel);
  }
  /**
   * {@inheritDoc ObservabilityTools.IUserLogger.success}
   */
  success(message, ...parameters) {
    return this.log('info', message, ...parameters);
  }
  /**
   * implements base class _log.
   */
  _log(message, level) {
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warning':
        console.warn(message);
        break;
      case 'info':
        console.info(message);
        break;
      default:
        console.log(message);
        break;
    }
    return (0, ts_utils_1.succeed)(message);
  }
}
exports.ConsoleUserLogger = ConsoleUserLogger;
/**
 * No-op user logger that suppresses all output.
 * @public
 */
class NoOpUserLogger extends ts_utils_1.Logging.LoggerBase {
  /**
   * Creates a new no-op user logger.
   * @param logLevel - The level of logging to be used.
   */
  constructor(logLevel) {
    super(logLevel);
  }
  /**
   * {@inheritDoc ObservabilityTools.IUserLogger.success}
   */
  success(message, ...parameters) {
    return (0, ts_utils_1.succeed)(undefined);
  }
  /**
   * Implements base class _log method.
   */
  _log(message, __level) {
    // no-op
    return (0, ts_utils_1.succeed)(message);
  }
}
exports.NoOpUserLogger = NoOpUserLogger;
/**
 * Observability context that provides both diagnostic and user logging capabilities.
 * @public
 */
class ObservabilityContext {
  /**
   * Creates a new observability context.
   * @param diag - The diagnostic logger.
   * @param user - The user logger.
   */
  constructor(diag, user) {
    this.diag = diag;
    this.user = user;
  }
}
exports.ObservabilityContext = ObservabilityContext;
//# sourceMappingURL=implementations.js.map
