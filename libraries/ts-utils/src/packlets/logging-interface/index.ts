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
import { MessageLogLevel, Success } from '../base';
import { Converter, Converters } from '../conversion';

/**
 * The level of logging to be used.
 * @public
 */
export type ReporterLogLevel = 'all' | 'detail' | 'info' | 'warning' | 'error' | 'silent';

/**
 * Exhaustive list of all {@link ReporterLogLevel} values.
 * @public
 */
export const allReporterLogLevels: readonly ReporterLogLevel[] = [
  'all',
  'detail',
  'info',
  'warning',
  'error',
  'silent'
] as const;

/**
 * Compile-time exhaustiveness guard ensuring {@link allReporterLogLevels} exactly matches every member of
 * {@link ReporterLogLevel}. Adding or removing a union member without updating the array fails the build.
 * @internal
 */
export type _ReporterLogLevelExhaustivenessCheck = [
  Exclude<ReporterLogLevel, (typeof allReporterLogLevels)[number]>,
  Exclude<(typeof allReporterLogLevels)[number], ReporterLogLevel>
] extends [never, never]
  ? true
  : never;

/**
 * @internal
 */
export const _reporterLogLevelExhaustivenessCheck: _ReporterLogLevelExhaustivenessCheck = true;

/**
 * A ready-made {@link Converter | Converter} for {@link ReporterLogLevel} values.
 * @public
 */
export const reporterLogLevelConverter: Converter<
  ReporterLogLevel,
  ReadonlyArray<ReporterLogLevel>
> = Converters.enumeratedValue<ReporterLogLevel>(allReporterLogLevels);

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
 * Extended logger interface that supports logging a short summary message at a
 * primary level (error/warn) while emitting the full detail at `detail` level.
 *
 * The detail is suppressed by default (requires log level `'detail'` or `'all'`),
 * keeping the primary log clean while preserving the full context for debugging.
 * @public
 */
export interface IDetailLogger extends ILogger {
  /**
   * Logs a short error summary at `error` level, then emits `detail` at `detail` level.
   * @param message - Short human-readable summary.
   * @param detail - Full detail (e.g. raw converter error) logged at `detail` level.
   */
  errorWithDetail(message: string, detail: unknown): Success<string | undefined>;

  /**
   * Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.
   * @param message - Short human-readable summary.
   * @param detail - Full detail logged at `detail` level.
   */
  warnWithDetail(message: string, detail: unknown): Success<string | undefined>;
}

/**
 * Type guard that checks whether a logger implements {@link IDetailLogger}.
 * @param logger - The logger to check.
 * @returns `true` if the logger implements `IDetailLogger`.
 * @public
 */
export function isDetailLogger(logger: ILogger): logger is IDetailLogger {
  return (
    typeof (logger as IDetailLogger).errorWithDetail === 'function' &&
    typeof (logger as IDetailLogger).warnWithDetail === 'function'
  );
}
