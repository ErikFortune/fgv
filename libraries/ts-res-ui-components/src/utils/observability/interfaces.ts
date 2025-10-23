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

import type { Logging, Success, IResultReporter } from '@fgv/ts-utils';

/**
 * Policy configuration for observability context behavior.
 * @public
 */
export interface IObservabilityPolicy {
  /**
   * If true, prevents automatic upgrade of the context (e.g., in tests).
   * Default (undefined or false) allows upgrade.
   */
  doNotUpgrade?: boolean;
}

/**
 * User logger interface that extends ILogger with success method for UI feedback.
 * @public
 */
export interface IUserLogger extends Logging.ILogger {
  /**
   * Logs a success message for user feedback.
   * @param message - The message to log.
   * @param parameters - The parameters to log.
   * @returns `Success` with the logged message if the level is enabled, or
   * `Success` with `undefined` if the message is suppressed.
   */
  success(message?: unknown, ...parameters: unknown[]): Success<string | undefined>;
}

/**
 * User log reporter interface that combines IUserLogger with IResultReporter.
 * @public
 */
export interface IUserLogReporter extends IUserLogger, IResultReporter<unknown> {}

/**
 * Observability context that provides both diagnostic and user logging capabilities.
 * @public
 */
export interface IObservabilityContext {
  /**
   * Diagnostic logger for internal system diagnostics.
   */
  readonly diag: Logging.LogReporter<unknown>;

  /**
   * User logger for user-facing messages and feedback.
   */
  readonly user: IUserLogReporter;

  /**
   * Optional policy configuration for context behavior.
   */
  readonly policy?: IObservabilityPolicy;
}
