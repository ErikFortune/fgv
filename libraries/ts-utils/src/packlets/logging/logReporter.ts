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
import { ILogger, ReporterLogLevel, NoOpLogger, stringifyLogValue } from './logger';
import { ErrorFormatter, IResultReporter, MessageLogLevel, Success } from '../base';

/**
 * A function that formats a value for logging.
 * @public
 */
export type LogValueFormatter<T, TD = unknown> = (value: T, detail?: TD) => string;

/**
 * A function that formats a message for logging.
 * @public
 */
export type LogMessageFormatter<TD = unknown> = (message: string, detail?: TD) => string;

/**
 * Parameters for creating a {@link Logging.LogReporter | LogReporter}.
 * @public
 */
export interface ILogReporterCreateParams<T, TD = unknown> {
  logger?: ILogger;
  valueFormatter?: LogValueFormatter<T, TD>;
  messageFormatter?: LogMessageFormatter<TD>;
}

/**
 * Abstract base class which wraps an existing {@link Logging.ILogger | ILogger} to implement
 * both {@link Logging.ILogger | ILogger} and {@link IResultReporter | IResultReporter}.
 * @public
 */
export class LogReporter<T, TD = unknown> implements ILogger, IResultReporter<T, TD> {
  /**
   * The logger to wrap.
   * @internal
   */
  protected readonly _logger: ILogger;

  /**
   * The formatter to use for values.
   * @internal
   */
  protected readonly _valueFormatter: LogValueFormatter<T, TD>;

  /**
   * The formatter to use for messages.
   * @internal
   */
  protected readonly _messageFormatter: LogMessageFormatter<TD>;

  /**
   * Creates a new {@link Logging.LogReporter | LogReporter}.
   * @param params - The parameters for creating the {@link Logging.LogReporter | LogReporter}.
   */
  public constructor(params?: ILogReporterCreateParams<T, TD>) {
    /* c8 ignore next 1 */
    params = params ?? {};
    this._logger = params.logger ?? new NoOpLogger();
    this._valueFormatter = params.valueFormatter ?? LogReporter.tryFormatObject;
    this._messageFormatter = params.messageFormatter ?? ((message, __detail) => message);
  }

  /**
   * {@inheritDoc Logging.ILogger.logLevel}
   */
  public get logLevel(): ReporterLogLevel {
    return this._logger.logLevel;
  }

  /**
   * {@inheritDoc Logging.ILogger.detail}
   */
  public detail(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this._logger.detail(message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.info}
   */
  public info(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this._logger.info(message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.warn}
   */
  public warn(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this._logger.warn(message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.error}
   */
  public error(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this._logger.error(message, ...parameters);
  }

  /**
   * {@inheritDoc Logging.ILogger.log}
   */
  public log(
    level: MessageLogLevel,
    message?: unknown,
    ...parameters: unknown[]
  ): Success<string | undefined> {
    return this._logger.log(level, message, ...parameters);
  }

  /**
   * {@inheritDoc IResultReporter.reportSuccess}
   */
  public reportSuccess(level: MessageLogLevel, value: T, detail?: TD, message?: ErrorFormatter<TD>): void {
    const formattedValue = this._valueFormatter(value, detail);
    const formatted = message ? message(formattedValue, detail) : formattedValue;
    this.log(level, formatted);
  }

  /**
   * {@inheritDoc IResultReporter.reportFailure}
   */
  public reportFailure(level: MessageLogLevel, message: string, detail?: TD): void {
    const formatted = this._messageFormatter(message, detail);
    this.log(level, formatted);
  }

  /**
   * Generic method to try to format an object for logging.
   * @param value - The value to format.
   * @param detail - The detail to format.
   * @returns
   */
  public static tryFormatObject<T = unknown, TD = unknown>(value: T, detail?: TD): string {
    return stringifyLogValue(value);
  }
}
