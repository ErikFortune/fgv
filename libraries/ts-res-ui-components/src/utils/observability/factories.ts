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

import { Logging } from '@fgv/ts-utils';
import type { IObservabilityContext } from './interfaces';
import type { IMessage } from '../../types';
import {
  ObservabilityContext,
  ConsoleUserLogger,
  NoOpUserLogger,
  ViewStateUserLogger
} from './implementations';

/**
 * Creates a console-based observability context for development and debugging.
 * @param diagLogLevel - Log level for diagnostic messages.
 * @param userLogLevel - Log level for user messages.
 * @returns A new observability context with console loggers.
 * @public
 */
export function createConsoleObservabilityContext(
  diagLogLevel: Logging.ReporterLogLevel = 'info',
  userLogLevel: Logging.ReporterLogLevel = 'info'
): IObservabilityContext {
  const diag = new Logging.ConsoleLogger(diagLogLevel);
  const user = new ConsoleUserLogger(userLogLevel);
  return new ObservabilityContext(diag, user);
}

/**
 * Creates a no-op observability context that suppresses all logging.
 * @param diagLogLevel - Log level for diagnostic messages.
 * @param userLogLevel - Log level for user messages.
 * @returns A new observability context with no-op loggers.
 * @public
 */
export function createNoOpObservabilityContext(
  diagLogLevel: Logging.ReporterLogLevel = 'silent',
  userLogLevel: Logging.ReporterLogLevel = 'silent'
): IObservabilityContext {
  const diag = new Logging.NoOpLogger(diagLogLevel);
  const user = new NoOpUserLogger(userLogLevel);
  return new ObservabilityContext(diag, user);
}

/**
 * Creates a test observability context with no-op loggers and non-upgrade policy.
 * @returns A new observability context configured for testing.
 * @public
 */
export function createTestObservabilityContext(): IObservabilityContext {
  const diag = new Logging.NoOpLogger('silent');
  const user = new NoOpUserLogger('silent');
  return new ObservabilityContext(diag, user, { doNotUpgrade: true });
}

/**
 * Default console-only observability context for general use.
 * @public
 */
export const DefaultObservabilityContext: IObservabilityContext = createConsoleObservabilityContext(
  'info',
  'info'
);

/**
 * Test observability context with no-op loggers.
 * @public
 */
export const TestObservabilityContext: IObservabilityContext = createTestObservabilityContext();

/**
 * Creates an observability context that forwards user messages to viewState.addMessage().
 * This bridges the observability system with React component state management.
 *
 * @param addMessage - Function to add messages to viewState (typically viewState.addMessage)
 * @param diagLogLevel - Log level for diagnostic messages (defaults to 'info')
 * @param userLogLevel - Log level for user messages (defaults to 'info')
 * @returns A new observability context with ViewState-connected user logger
 * @public
 */
export function createViewStateObservabilityContext(
  addMessage: (type: IMessage['type'], message: string) => void,
  diagLogLevel: Logging.ReporterLogLevel = 'info',
  userLogLevel: Logging.ReporterLogLevel = 'info'
): IObservabilityContext {
  const diag = new Logging.ConsoleLogger(diagLogLevel);
  const user = new ViewStateUserLogger(addMessage, userLogLevel);
  return new ObservabilityContext(diag, user);
}
