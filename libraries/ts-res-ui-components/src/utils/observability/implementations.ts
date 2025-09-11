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
import type { IMessage } from '../../types';

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
   * {@inheritDoc ObservabilityTools.IUserLogger.success}
   */
  public success(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return this.log('info', message, ...parameters);
  }

  /**
   * implements base class _log.
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
   * {@inheritDoc ObservabilityTools.IUserLogger.success}
   */
  public success(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    return succeed(undefined);
  }

  /**
   * Implements base class _log method.
   */
  protected _log(message: string, __level: MessageLogLevel): Success<string | undefined> {
    // no-op
    return succeed(message);
  }
}

/**
 * ViewState-connected user logger that forwards messages to viewState.addMessage().
 * This logger bridges the observability system with React component state management.
 * @public
 */
export class ViewStateUserLogger extends Logging.LoggerBase implements IUserLogger {
  private readonly _addMessage: (type: IMessage['type'], message: string) => void;

  /**
   * Creates a new ViewState user logger.
   * @param addMessage - Function to add messages to viewState (typically viewState.addMessage)
   * @param logLevel - The level of logging to be used.
   */
  public constructor(
    addMessage: (type: IMessage['type'], message: string) => void,
    logLevel?: Logging.ReporterLogLevel
  ) {
    super(logLevel);
    this._addMessage = addMessage;
  }

  /**
   * {@inheritDoc ObservabilityTools.IUserLogger.success}
   */
  public success(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    // Format message manually since we want different behavior than the base class
    const formattedMessage = this._formatLogMessage(message, ...parameters);
    this._addMessage('success', formattedMessage);
    return succeed(formattedMessage);
  }

  /**
   * Message formatting helper with better object serialization
   */
  private _formatLogMessage(message?: unknown, ...parameters: unknown[]): string {
    if (message === undefined) {
      return '';
    }

    const baseMessage = this._formatValue(message);
    if (parameters.length === 0) {
      return baseMessage;
    }

    // Format each parameter with proper object handling
    return `${baseMessage} ${parameters.map((p) => this._formatValue(p)).join(' ')}`;
  }

  /**
   * Format a single value with better object serialization
   */
  private _formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);

    // For objects, try JSON.stringify with fallback
    try {
      return JSON.stringify(value, null, 0);
    } catch {
      return String(value);
    }
  }

  /**
   * Implements base class _log method by forwarding to viewState.addMessage.
   */
  protected _log(message: string, level: MessageLogLevel): Success<string | undefined> {
    // Map MessageLogLevel to IMessage['type']
    const messageType: IMessage['type'] =
      level === 'warning' ? 'warning' : level === 'error' ? 'error' : 'info';

    this._addMessage(messageType, message);
    return succeed(message);
  }
}

/**
 * Observability context that provides both diagnostic and user logging capabilities.
 * @public
 */
export class ObservabilityContext implements IObservabilityContext {
  /**
   * {@inheritDoc ObservabilityTools.IObservabilityContext.diag}
   */
  public readonly diag: Logging.ILogger;

  /**
   * {@inheritDoc ObservabilityTools.IObservabilityContext.user}
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

/**
 * Context type classification for observability contexts.
 * @public
 */
export type ObservabilityContextType = 'viewstate' | 'console' | 'custom';

/**
 * Detects the type of observability context based on the user logger implementation.
 * @param context - The observability context to analyze
 * @returns The detected context type
 * @public
 */
export function detectObservabilityContextType(context: IObservabilityContext): ObservabilityContextType {
  if (context.user instanceof ViewStateUserLogger) {
    return 'viewstate';
  }
  if (context.user instanceof ConsoleUserLogger || context.user instanceof NoOpUserLogger) {
    return 'console';
  }
  return 'custom';
}

/**
 * Checks if an observability context is connected to ViewState for UI message display.
 * @param context - The observability context to check
 * @returns True if the context sends user messages to ViewState
 * @public
 */
export function isViewStateConnected(context: IObservabilityContext): boolean {
  return context.user instanceof ViewStateUserLogger;
}

/**
 * Checks if an observability context only outputs to console (not UI messages).
 * @param context - The observability context to check
 * @returns True if the context only outputs to console
 * @public
 */
export function isConsoleOnlyContext(context: IObservabilityContext): boolean {
  return context.user instanceof ConsoleUserLogger || context.user instanceof NoOpUserLogger;
}
