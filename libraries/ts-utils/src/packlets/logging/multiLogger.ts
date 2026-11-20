/*
 * Copyright (c) 2020 Erik Fortune
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
import { MessageLogLevel, Success, succeed } from '../base';
import { ILogger, ReporterLogLevel } from './logger';

/**
 * Verbosity rank for each {@link Logging.ReporterLogLevel | ReporterLogLevel}, materializing
 * the {@link Logging.shouldLog | shouldLog} ordering. A higher rank is more permissive
 * (emits strictly more message levels).
 * @internal
 */
const verbosityRank: Record<ReporterLogLevel, number> = {
  silent: 0,
  error: 1,
  warning: 2,
  info: 3,
  detail: 4,
  all: 5
};

/**
 * An {@link Logging.ILogger | ILogger} that fans every log call out to N child loggers,
 * each applying its own threshold.
 *
 * @remarks
 * The composite does not pre-filter — it forwards the raw `(level, message, ...params)`
 * to each child's public method so each child formats and filters per its own rules.
 * This lets a single pinned logger feed, for example, a {@link Logging.ConsoleLogger | ConsoleLogger}
 * (stdout) and a {@link Logging.RetainingLogger | RetainingLogger} (observability buffer)
 * with independent log levels.
 *
 * @public
 */
export class MultiLogger implements ILogger {
  /**
   * The child loggers calls are fanned out to.
   * @internal
   */
  private readonly _loggers: ReadonlyArray<ILogger>;

  /**
   * Creates a new multi logger.
   * @param loggers - The child loggers to fan calls out to.
   */
  public constructor(loggers: ReadonlyArray<ILogger>) {
    this._loggers = [...loggers];
  }

  /**
   * The most-verbose (most-permissive) level among the children, so an upstream
   * `shouldLog` gate does not suppress a call before it can fan out to a more
   * permissive child. Computed on access, since a child's level may change.
   */
  public get logLevel(): ReporterLogLevel {
    return this._loggers.reduce<ReporterLogLevel>(
      (most, logger) => (verbosityRank[logger.logLevel] > verbosityRank[most] ? logger.logLevel : most),
      'silent'
    );
  }

  /**
   * {@inheritDoc Logging.ILogger.log}
   */
  public log(
    level: MessageLogLevel,
    message?: unknown,
    ...parameters: unknown[]
  ): Success<string | undefined> {
    let logged: string | undefined;
    for (const logger of this._loggers) {
      const value = logger.log(level, message, ...parameters).value;
      if (value !== undefined) {
        logged = value;
      }
    }
    return succeed(logged);
  }

  /**
   * {@inheritDoc Logging.ILogger.detail}
   */
  public detail(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('detail', message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.info}
   */
  public info(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('info', message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.warn}
   */
  public warn(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('warning', message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.error}
   */
  public error(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('error', message, ...parameters);
  }
}
