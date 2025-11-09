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
import * as ObservabilityTools from '../utils/observability';

/**
 * React context for observability infrastructure.
 * Provides access to diagnostic and user loggers throughout the component tree.
 * @public
 */
export const ObservabilityContext: React.Context<ObservabilityTools.IObservabilityContext> =
  createContext<ObservabilityTools.IObservabilityContext>(ObservabilityTools.DefaultObservabilityContext);

/**
 * Props for the ObservabilityProvider component.
 * @public
 */
export interface IObservabilityProviderProps {
  /** Child components that will have access to the observability context */
  children: ReactNode;
  /** Optional observability context to provide (defaults to console-based context) */
  observabilityContext?: ObservabilityTools.IObservabilityContext;
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
 * // Custom observability context
 * const customContext = ObservabilityTools.createConsoleObservabilityContext('debug', 'info');
 * <ObservabilityProvider observabilityContext={customContext}>
 *   <MyApp />
 * </ObservabilityProvider>
 *
 * // With custom user logger that forwards to app's message system
 * const contextWithMessages = new ObservabilityTools.ObservabilityContext(
 *   new ObservabilityTools.ConsoleUserLogger('info'),
 *   createCallbackUserLogger((type, message) => showToast(type, message))
 * );
 * <ObservabilityProvider observabilityContext={contextWithMessages}>
 *   <MyApp />
 * </ObservabilityProvider>
 * ```
 *
 * @param props - Provider configuration
 * @returns JSX provider element
 * @public
 */
export const ObservabilityProvider: React.FC<IObservabilityProviderProps> = ({
  children,
  observabilityContext = ObservabilityTools.DefaultObservabilityContext
}) => <ObservabilityContext.Provider value={observabilityContext}>{children}</ObservabilityContext.Provider>;

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
 * @public
 */
export const useObservability = (): ObservabilityTools.IObservabilityContext => {
  return useContext(ObservabilityContext);
};
