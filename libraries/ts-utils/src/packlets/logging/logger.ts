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
import { MessageLogLevel, Success, captureResult, succeed } from '../base';

/**
 * The level of logging to be used.
 * @public
 */
export type ReporterLogLevel = 'all' | 'detail' | 'info' | 'warning' | 'error' | 'silent';

/**
 * Compares two log levels.
 * @param message - The first log level.
 * @param reporter - The second log level.
 * @returns `true` if the message should be logged, `false` if it should be suppressed.
 * @public
 */
export function shouldLog(message: MessageLogLevel, reporter: ReporterLogLevel): boolean {
  if (reporter === 'all') {
    return true; // 'all' logs everything, including 'quiet'
  }
  if (reporter === 'silent') {
    return false; // 'silent' suppresses everything
  }
  if (message === 'quiet') {
    return false; // 'quiet' messages only show when reporter is 'all'
  }
  switch (reporter) {
    case 'error':
      return message === 'error';
    case 'warning':
      return message === 'warning' || message === 'error';
    case 'info':
      return message !== 'detail';
  }
  return true;
}

/**
 * Stringifies an arbitrary value for logging.
 * @param value - The value to stringify.
 * @returns The stringified value.
 * @param maxLength - The maximum length of the stringified value.
 * @public
 */
export function stringifyLogValue(value: unknown, maxLength?: number): string {
  maxLength = maxLength ?? 40;
  if (typeof value === 'string') {
    return value;
  }
  const str = String(value);
  if (str === '[object Object]') {
    return captureResult(() => JSON.stringify(value))
      .onSuccess((s) => {
        return succeed(s.length < maxLength ? s : s.substring(0, maxLength - 3) + '...');
      })
      .orDefault(str);
  }
  return str;
}

/**
 * Generic Result-aware logger interface with multiple levels of logging.
 * @public
 */
export interface ILogger {
  /**
   * The level of logging to be used.
   */
  readonly logLevel: ReporterLogLevel;

  /**
   * Logs a message at the given level.
   * @param level - The level of the message.
   * @param message - The message to log.
   * @param parameters - The parameters to log.
   * @returns `Success` with the logged message if the level is enabled, or
   * `Success` with `undefined` if the message is suppressed.
   */
  log(level: MessageLogLevel, message?: unknown, ...parameters: unknown[]): Success<string | undefined>;

  /**
   * Logs a detail message.
   * @param message - The message to log.
   * @param parameters - The parameters to log.
   * @returns `Success` with the logged message if the level is enabled, or
   * `Success` with `undefined` if the message is suppressed.
   */
  detail(message?: unknown, ...parameters: unknown[]): Success<string | undefined>;

  /**
   * Logs an info message.
   * @param message - The message to log.
   * @param parameters - The parameters to log.
   * @returns `Success` with the logged message if the level is enabled, or
   * `Success` with `undefined` if the message is suppressed.
   */
  info(message?: unknown, ...parameters: unknown[]): Success<string | undefined>;

  /**
   * Logs a warning message.
   * @param message - The message to log.
   * @param parameters - The parameters to log.
   * @returns `Success` with the logged message if the level is enabled, or
   * `Success` with `undefined` if the message is suppressed.
   */
  warn(message?: unknown, ...parameters: unknown[]): Success<string | undefined>;

  /**
   * Logs an error message.
   * @param message - The message to log.
   * @param parameters - The parameters to log.
   * @returns `Success` with the logged message if the level is enabled, or
   * `Success` with `undefined` if the message is suppressed.
   */
  error(message?: unknown, ...parameters: unknown[]): Success<string | undefined>;
}

/**
 * Abstract base class which implements {@link Logging.ILogger | ILogger}.
 * @public
 */
export abstract class LoggerBase implements ILogger {
  /**
   * {@inheritDoc Logging.ILogger.logLevel}
   */
  public logLevel: ReporterLogLevel = 'info';

  protected constructor(logLevel?: ReporterLogLevel) {
    this.logLevel = logLevel ?? 'info';
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

  /**
   * {@inheritDoc Logging.ILogger.log}
   */
  public log(
    level: MessageLogLevel,
    message?: unknown,
    ...parameters: unknown[]
  ): Success<string | undefined> {
    if (shouldLog(level, this.logLevel)) {
      const formatted = this._format(message, ...parameters);
      return this._log(formatted, level);
    }
    return this._suppressLog(level, message, ...parameters);
  }

  /**
   * Formats a message and parameters into a string.
   * @param message - The message to format.
   * @param parameters - The parameters to format.
   * @returns The formatted message.
   * @public
   */
  protected _format(message?: unknown, ...parameters: unknown[]): string {
    const raw = [message, ...parameters];
    const filtered = raw.filter((m): m is string => m !== undefined);
    const strings = filtered.map((m) => stringifyLogValue(m));
    const joined = strings.join('');
    return joined;
  }

  /**
   * Inner method called for suppressed log messages.
   * @public
   */
  protected _suppressLog(
    __level: MessageLogLevel,
    __message?: unknown,
    ...__parameters: unknown[]
  ): Success<undefined> {
    return succeed(undefined);
  }

  /**
   * Inner method called for logged messages. Should be implemented by derived classes.
   * @param message - The message to log.
   * @param level - The {@link MessageLogLevel | level} of the message.
   * @returns `Success` with the logged message, or `Success` with `undefined` if the message is suppressed.
   * @public
   */
  protected abstract _log(message: string, level: MessageLogLevel): Success<string | undefined>;
}

/**
 * An in-memory logger that stores logged and suppressed messages.
 * @public
 */
export class InMemoryLogger extends LoggerBase {
  /**
   * The messages that have been logged.
   * @internal
   */
  private _logged: string[] = [];

  /**
   * The messages that have been suppressed.
   * @internal
   */
  private _suppressed: string[] = [];

  /**
   * Creates a new in-memory logger.
   * @param logLevel - The level of logging to be used.
   */
  public constructor(logLevel?: ReporterLogLevel) {
    super(logLevel);
  }

  /**
   * The messages that have been logged.
   */
  public get logged(): string[] {
    return this._logged;
  }

  /**
   * The messages that have been suppressed.
   */
  public get suppressed(): string[] {
    return this._suppressed;
  }

  /**
   * Clears the logged and suppressed messages.
   */
  public clear(): void {
    this._logged = [];
    this._suppressed = [];
  }

  /**
   * {@inheritDoc Logging.LoggerBase._log}
   * @internal
   */
  protected _log(message: string, __level: MessageLogLevel): Success<string | undefined> {
    this._logged.push(message);
    return succeed(message);
  }

  /**
   * {@inheritDoc Logging.LoggerBase._suppressLog}
   * @param level - The level of the message.
   * @param message - The message to suppress.
   * @param parameters - The parameters to suppress.
   * @returns `Success` with `undefined` if the message is suppressed.
   * @internal
   */
  protected _suppressLog(
    level: MessageLogLevel,
    message?: unknown,
    ...parameters: unknown[]
  ): Success<undefined> {
    const formatted = this._format(message, ...parameters);
    this._suppressed.push(formatted);
    return succeed(undefined);
  }
}

/**
 * A console logger that outputs messages to the console.
 * @public
 */
export class ConsoleLogger extends LoggerBase {
  /**
   * Creates a new console logger.
   * @param logLevel - The level of logging to be used.
   */
  public constructor(logLevel?: ReporterLogLevel) {
    super(logLevel);
  }

  /**
   * {@inheritDoc Logging.LoggerBase._log}
   * @internal
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
 * A no-op {@link Logging.LoggerBase | LoggerBase} that does not log anything.
 * @public
 */
export class NoOpLogger extends LoggerBase {
  /**
   * Creates a new no-op logger.
   * @param logLevel - The level of logging to be used.
   */
  public constructor(logLevel?: ReporterLogLevel) {
    super(logLevel);
  }

  /**
   * {@inheritDoc Logging.LoggerBase._log}
   * @internal
   */
  protected _log(message: string, __level: MessageLogLevel): Success<string | undefined> {
    // no-op
    return succeed(message);
  }
}
