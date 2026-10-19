/*
 * Copyright (c) 2026 Erik Fortune
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

import type { Logging } from '@fgv/ts-utils';
import type { Logger, LogLevel } from '@typesafe-ai/sdk';

/**
 * The SDK's log level for an fgv logger. Never `debug`: at `debug` the SDK logs request bodies,
 * which carry the state, unredacted.
 */
function sdkLogLevel(level: Logging.ReporterLogLevel): LogLevel {
  switch (level) {
    case 'warning':
      return 'warn';
    case 'error':
      return 'error';
    case 'silent':
      return 'off';
    default:
      // all, detail, info
      return 'info';
  }
}

/** Discards every message. */
function discard(): void {
  // nothing to do
}

const noOpSink: Logger = { debug: discard, info: discard, warn: discard, error: discard };

/**
 * The SDK logger configuration. Both values are always passed to the SDK, so that neither
 * `TYPESAFE_LOG_LEVEL` nor the SDK's default `console` sink can take effect.
 * @internal
 */
export interface ISdkLogging {
  readonly logLevel: LogLevel;
  readonly logger: Logger;
}

/**
 * What this package uses of an fgv `ILogger`: its level, and the four methods it forwards to. An
 * `ILogger` is one.
 * @internal
 */
export interface ISdkLogTarget {
  readonly logLevel: Logging.ReporterLogLevel;
  detail(message?: unknown, ...parameters: unknown[]): unknown;
  info(message?: unknown, ...parameters: unknown[]): unknown;
  warn(message?: unknown, ...parameters: unknown[]): unknown;
  error(message?: unknown, ...parameters: unknown[]): unknown;
}

/**
 * Adapts an fgv logger to the SDK's `Logger`. With no logger, logging is off and the sink
 * discards.
 * @internal
 */
export function sdkLogging(logger: ISdkLogTarget | undefined): ISdkLogging {
  if (logger === undefined) {
    return { logLevel: 'off', logger: noOpSink };
  }
  return {
    logLevel: sdkLogLevel(logger.logLevel),
    logger: {
      debug: (message, ...args) => {
        logger.detail(message, ...args);
      },
      info: (message, ...args) => {
        logger.info(message, ...args);
      },
      warn: (message, ...args) => {
        logger.warn(message, ...args);
      },
      error: (message, ...args) => {
        logger.error(message, ...args);
      }
    }
  };
}
