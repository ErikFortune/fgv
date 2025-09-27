/*
 * MIT License
 *
 * Copyright (c) 2023 Erik Fortune
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

/**
 * Logging context interface for sudoku library components.
 * Provides optional diagnostic logging capability.
 * @public
 */
export interface ISudokuLoggingContext {
  /**
   * Optional diagnostic logger for internal system diagnostics.
   * When provided, enables detailed logging of puzzle operations,
   * hint generation, and solving progress.
   */
  readonly logger?: Logging.ILogger;
}

/**
 * Default no-op logging context.
 * @public
 */
export const DefaultSudokuLoggingContext: ISudokuLoggingContext = {
  logger: undefined
};

/**
 * Helper function to safely log a message if logger is available.
 * @param context - The logging context
 * @param level - The log level
 * @param message - The message to log
 * @param parameters - Additional parameters
 * @internal
 */
export function logIfAvailable(
  context: ISudokuLoggingContext | undefined,
  level: 'detail' | 'info' | 'warn' | 'error',
  message?: unknown,
  ...parameters: unknown[]
): void {
  if (context?.logger) {
    switch (level) {
      case 'detail':
        context.logger.detail(message, ...parameters);
        break;
      case 'info':
        context.logger.info(message, ...parameters);
        break;
      case 'warn':
        context.logger.warn(message, ...parameters);
        break;
      case 'error':
        context.logger.error(message, ...parameters);
        break;
    }
  }
}
