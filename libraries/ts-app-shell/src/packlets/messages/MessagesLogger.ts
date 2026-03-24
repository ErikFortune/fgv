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
 * Bridge between the MessagesContext and the ts-utils ILogger/LogReporter system.
 *
 * Provides an ILogger implementation that routes log messages into the
 * MessagesContext, enabling Result.report() integration in React components.
 *
 * @packageDocumentation
 */

import { Logging, type MessageLogLevel, Success, succeed } from '@fgv/ts-utils';

import { type IMessageAction, type MessageSeverity } from './model';
import { type IMessagesContextValue } from './MessagesContext';

// ============================================================================
// Level Mapping
// ============================================================================

/**
 * Maps ts-utils MessageLogLevel to our MessageSeverity.
 * `detail` maps to `'info'` (shown when logLevel is 'detail' or 'all').
 * `quiet` is always suppressed (only shown when reporter level is 'all', handled upstream).
 * @internal
 */
function mapLogLevel(level: MessageLogLevel): MessageSeverity | undefined {
  switch (level) {
    case 'detail':
    case 'info':
      return 'info';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'quiet':
      return undefined;
  }
}

// ============================================================================
// MessagesLogger
// ============================================================================

/**
 * An {@link @fgv/ts-utils#Logging.ILogger | ILogger} implementation that routes
 * messages into a {@link IMessagesContextValue | MessagesContext}.
 *
 * Use this as the `logger` parameter when creating a `LogReporter` to get
 * full `Result.report()` integration that feeds into the app's toast/log system.
 *
 * @example
 * ```typescript
 * const { addMessage } = useMessages();
 * const logger = new MessagesLogger(addMessage);
 * const reporter = new LogReporter<unknown>({ logger });
 *
 * // Now Result.report() flows into toasts + log panel
 * someResult.report(reporter, { success: 'info', failure: 'error' });
 * ```
 *
 * @public
 */
export class MessagesLogger extends Logging.LoggerBase {
  private readonly _addMessage: IMessagesContextValue['addMessage'];
  private readonly _defaultAction: IMessageAction | undefined;

  /**
   * Creates a new MessagesLogger.
   * @param addMessage - The addMessage function from MessagesContext
   * @param logLevel - The minimum log level to display (default: 'info')
   * @param defaultAction - Optional default action to attach to all messages
   */
  public constructor(
    addMessage: IMessagesContextValue['addMessage'],
    logLevel?: Logging.ReporterLogLevel,
    defaultAction?: IMessageAction
  ) {
    super(logLevel);
    this._addMessage = addMessage;
    this._defaultAction = defaultAction;
  }

  /**
   * Routes a formatted log message into the MessagesContext.
   * @param message - The formatted message string
   * @param level - The log level
   * @returns Success with the message if it was logged, or Success with undefined if suppressed
   * @internal
   */
  protected _log(message: string, level: MessageLogLevel): Success<string | undefined> {
    const severity = mapLogLevel(level);
    if (severity !== undefined) {
      this._addMessage(severity, message, this._defaultAction);
      return succeed(message);
    }
    return succeed(undefined);
  }
}
