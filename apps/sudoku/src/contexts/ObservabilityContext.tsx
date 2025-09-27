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

import React, { createContext, useContext, ReactNode } from 'react';
import { Logging, succeed } from '@fgv/ts-utils';
import type { Success, IResultReporter, MessageLogLevel } from '@fgv/ts-utils';

/**
 * User logger interface that extends ILogger with success method for UI feedback.
 */
export interface IUserLogger extends Logging.ILogger {
  /**
   * Logs a success message for user feedback.
   * @param message - The message to log.
   * @param parameters - The parameters to log.
   * @returns Success with the logged message if the level is enabled, or
   * Success with undefined if the message is suppressed.
   */
  success(message?: unknown, ...parameters: unknown[]): Success<string | undefined>;
}

/**
 * User log reporter interface that combines IUserLogger with IResultReporter.
 */
export interface IUserLogReporter extends IUserLogger, IResultReporter<unknown> {}

/**
 * Observability context that provides both diagnostic and user logging capabilities.
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
}

/**
 * Toast notification type for user messages.
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Function signature for showing toast notifications.
 */
export type ShowToastFunction = (type: ToastType, message: string) => void;

/**
 * Console-based user logger that logs to console and optionally shows toasts.
 */
class ConsoleUserLogger extends Logging.LoggerBase implements IUserLogReporter {
  private showToast?: ShowToastFunction;

  constructor(logLevel?: Logging.ReporterLogLevel, showToast?: ShowToastFunction) {
    super(logLevel);
    this.showToast = showToast;
  }

  protected _log(message: string, level: MessageLogLevel): Success<string | undefined> {
    // Log to console for diagnostics
    switch (level) {
      case 'error':
        console.error(`[User] ${message}`);
        break;
      case 'warning':
        console.warn(`[User] ${message}`);
        break;
      case 'info':
        console.info(`[User] ${message}`);
        break;
      default:
        console.log(`[User] ${message}`);
        break;
    }

    // Show toast if available
    if (this.showToast) {
      const toastType = this._mapLogLevelToToastType(level);
      this.showToast(toastType, message);
    }

    return succeed(message);
  }

  public success(message?: unknown, ...parameters: unknown[]): Success<string | undefined> {
    const formatted = this._format(message, ...parameters);
    console.log(`[User] ${formatted}`);

    if (this.showToast) {
      this.showToast('success', formatted);
    }

    return succeed(formatted);
  }

  public reportSuccess(__level: MessageLogLevel, __value: unknown, __detail?: unknown): void {
    // Result reporting implementation - could be enhanced later
  }

  public reportFailure(level: MessageLogLevel, message: string, __detail?: unknown): void {
    this.log(level, `Operation failed: ${message}`);
  }

  private _mapLogLevelToToastType(level: MessageLogLevel): ToastType {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  }
}

/**
 * Creates a default observability context with console-based loggers.
 */
function createDefaultObservabilityContext(showToast?: ShowToastFunction): IObservabilityContext {
  return {
    diag: new Logging.LogReporter(new Logging.ConsoleLogger('info')),
    user: new ConsoleUserLogger('info', showToast)
  };
}

/**
 * Default observability context with console-only logging.
 */
export const DefaultObservabilityContext: IObservabilityContext = createDefaultObservabilityContext();

/**
 * React context for observability infrastructure.
 * Provides access to diagnostic and user loggers throughout the component tree.
 */
export const ObservabilityContext: React.Context<IObservabilityContext> =
  createContext<IObservabilityContext>(DefaultObservabilityContext);

/**
 * Props for the ObservabilityProvider component.
 */
export interface IObservabilityProviderProps {
  /** Child components that will have access to the observability context */
  children: ReactNode;
  /** Optional observability context to provide (defaults to console-based context) */
  observabilityContext?: IObservabilityContext;
  /** Optional function to show toast notifications */
  showToast?: ShowToastFunction;
}

/**
 * Provider component that makes observability context available to all child components.
 *
 * @example
 * ```tsx
 * // Basic usage with default console logging
 * <ObservabilityProvider>
 *   <MyApp />
 * </ObservabilityProvider>
 *
 * // With toast notifications
 * <ObservabilityProvider showToast={(type, message) => showToast(type, message)}>
 *   <MyApp />
 * </ObservabilityProvider>
 * ```
 */
export const ObservabilityProvider: React.FC<IObservabilityProviderProps> = ({
  children,
  observabilityContext,
  showToast
}) => {
  const context = React.useMemo(() => {
    return observabilityContext ?? createDefaultObservabilityContext(showToast);
  }, [observabilityContext, showToast]);

  return <ObservabilityContext.Provider value={context}>{children}</ObservabilityContext.Provider>;
};

/**
 * Hook to access the current observability context.
 *
 * Provides access to both diagnostic logging (for developers/debugging) and
 * user logging (for user-facing messages and feedback).
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const observability = useObservability();
 *
 *   const handleAction = () => {
 *     // Log diagnostic info for developers
 *     observability.diag.info('User clicked action button');
 *
 *     try {
 *       performAction();
 *       // Show success message to user
 *       observability.user.success('Action completed successfully!');
 *     } catch (error) {
 *       // Log error for debugging
 *       observability.diag.error('Action failed:', error);
 *       // Show error to user
 *       observability.user.error('Action failed. Please try again.');
 *     }
 *   };
 *
 *   return <button onClick={handleAction}>Perform Action</button>;
 * }
 * ```
 *
 * @returns The current observability context with diag and user loggers
 */
export const useObservability = (): IObservabilityContext => {
  return useContext(ObservabilityContext);
};
