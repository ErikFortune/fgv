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

import React, { createContext, useContext, ReactNode } from 'react';
import { Logging } from '@fgv/ts-utils';

/**
 * Default diagnostic logger (no-op for production).
 * @public
 */
export const DefaultDiagnosticLogger: Logging.LogReporter<unknown> = new Logging.LogReporter({
  logger: new Logging.NoOpLogger()
});

/**
 * React context for diagnostic logging.
 * Provides access to diagnostic logger throughout the component tree.
 * @public
 */
export const DiagnosticLoggerContext: React.Context<Logging.LogReporter<unknown>> =
  createContext<Logging.LogReporter<unknown>>(DefaultDiagnosticLogger);

/**
 * Props for the DiagnosticLoggerProvider component.
 * @public
 */
export interface IDiagnosticLoggerProviderProps {
  /** Child components that will have access to the diagnostic logger */
  children: ReactNode;
  /** Optional logger to provide (defaults to no-op logger) */
  logger?: Logging.LogReporter<unknown>;
}

/**
 * Provider component that makes diagnostic logger available to all child components.
 *
 * @example
 * ```tsx
 * // Basic usage with default no-op logger
 * <DiagnosticLoggerProvider>
 *   <SudokuGrid />
 * </DiagnosticLoggerProvider>
 *
 * // Console logging for development
 * const consoleLogger = new Logging.LogReporter({
 *   logger: new Logging.ConsoleLogger('info')
 * });
 * <DiagnosticLoggerProvider logger={consoleLogger}>
 *   <SudokuGrid />
 * </DiagnosticLoggerProvider>
 *
 * // In-memory logger for tests
 * const testLogger = new Logging.LogReporter({
 *   logger: new Logging.InMemoryLogger('detail')
 * });
 * <DiagnosticLoggerProvider logger={testLogger}>
 *   <SudokuGrid />
 * </DiagnosticLoggerProvider>
 * ```
 *
 * @param props - Provider configuration
 * @returns JSX provider element
 * @public
 */
export const DiagnosticLoggerProvider: React.FC<IDiagnosticLoggerProviderProps> = ({
  children,
  logger = DefaultDiagnosticLogger
}) => <DiagnosticLoggerContext.Provider value={logger}>{children}</DiagnosticLoggerContext.Provider>;

/**
 * Hook to access the current diagnostic logger.
 *
 * Provides access to diagnostic logging for development and debugging.
 *
 * @example
 * ```tsx
 * function CageOverlay({ cages }: ICageOverlayProps) {
 *   const log = useDiagnosticLogger();
 *
 *   useEffect(() => {
 *     log.info('CageOverlay rendered', {
 *       cageCount: cages.length,
 *       cages: cages.map((c) => ({ id: c.cage.id, cellIds: c.cage.cellIds }))
 *     });
 *   }, [cages, log]);
 *
 *   return <div>...</div>;
 * }
 * ```
 *
 * @returns The current diagnostic logger
 * @public
 */
export const useDiagnosticLogger = (): Logging.LogReporter<unknown> => {
  return useContext(DiagnosticLoggerContext);
};
