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

import { Logging, MessageLogLevel, Success, succeed } from '@fgv/ts-utils';
import type { IUserLogger, IObservabilityContext } from './interfaces';

/**
 * Console-based user logger that extends diagnostic logging with success method.
 * @public
 */
export class ConsoleUserLogger extends Logging.LoggerBase implements IUserLogger {
  /**
   * Creates a new console user logger.
   * @param logLevel - The level of logging to be used.
   */
  public constructor(logLevel?: Logging.ReporterLogLevel) {
    super(logLevel);
  }

  /**
   * {@inheritDoc IUserLogger.success}
   */
  public success(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('info', message, ...parameters);
  }

  /**
   * {@inheritDoc LoggerBase._log}
   */
  protected _log(message: string, level: MessageLogLevel): Success<string | undefined> {
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
    return succeed(message);
  }
}

/**
 * No-op user logger that suppresses all output.
 * @public
 */
export class NoOpUserLogger extends Logging.LoggerBase implements IUserLogger {
  /**
   * Creates a new no-op user logger.
   * @param logLevel - The level of logging to be used.
   */
  public constructor(logLevel?: Logging.ReporterLogLevel) {
    super(logLevel);
  }

  /**
   * {@inheritDoc IUserLogger.success}
   */
  public success(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return succeed(undefined);
  }

  /**
   * {@inheritDoc LoggerBase._log}
   */
  protected _log(message: string, __level: MessageLogLevel): Success<string | undefined> {
    // no-op
    return succeed(message);
  }
}

/**
 * Observability context that provides both diagnostic and user logging capabilities.
 * @public
 */
export class ObservabilityContext implements IObservabilityContext {
  /**
   * {@inheritDoc IObservabilityContext.diag}
   */
  public readonly diag: Logging.ILogger;

  /**
   * {@inheritDoc IObservabilityContext.user}
   */
  public readonly user: IUserLogger;

  /**
   * Creates a new observability context.
   * @param diag - The diagnostic logger.
   * @param user - The user logger.
   */
  public constructor(diag: Logging.ILogger, user: IUserLogger) {
    this.diag = diag;
    this.user = user;
  }
}
