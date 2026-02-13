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

/**
 * React hook that provides a LogReporter wired into the MessagesContext.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const reporter = useLogReporter();
 *
 *   const handleSave = () => {
 *     const result = workspace.save(data);
 *     // Automatically shows success toast or error in log panel
 *     result.report(reporter, {
 *       success: { level: 'info', message: () => 'Saved successfully' },
 *       failure: 'error'
 *     });
 *   };
 * }
 * ```
 *
 * @packageDocumentation
 */

import { useMemo } from 'react';

import { Logging } from '@fgv/ts-utils';

import { useMessages } from './MessagesContext';
import { MessagesLogger } from './MessagesLogger';

/**
 * Options for the useLogReporter hook.
 * @public
 */
export interface IUseLogReporterOptions {
  /** Minimum log level (default: 'info') */
  readonly logLevel?: Logging.ReporterLogLevel;
}

/**
 * React hook that creates a {@link @fgv/ts-utils#Logging.LogReporter | LogReporter}
 * backed by the MessagesContext.
 *
 * The returned reporter implements both `ILogger` and `IResultReporter<unknown>`,
 * so it can be used with `Result.report()` and direct logging calls.
 *
 * @param options - Optional configuration
 * @returns A LogReporter that routes messages into the toast/log system
 * @public
 */
export function useLogReporter(options?: IUseLogReporterOptions): Logging.LogReporter<unknown> {
  const { addMessage } = useMessages();
  const logLevel = options?.logLevel;

  return useMemo(() => {
    const logger = new MessagesLogger(addMessage, logLevel);
    return new Logging.LogReporter<unknown>({ logger });
  }, [addMessage, logLevel]);
}
