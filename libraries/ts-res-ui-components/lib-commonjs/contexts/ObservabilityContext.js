'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.useObservability = exports.ObservabilityProvider = exports.ObservabilityContext = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const ObservabilityTools = tslib_1.__importStar(require('../utils/observability'));
/**
 * React context for observability infrastructure.
 * Provides access to diagnostic and user loggers throughout the component tree.
 * @public
 */
exports.ObservabilityContext = (0, react_1.createContext)(ObservabilityTools.DefaultObservabilityContext);
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
const ObservabilityProvider = ({
  children,
  observabilityContext = ObservabilityTools.DefaultObservabilityContext
}) =>
  react_1.default.createElement(
    exports.ObservabilityContext.Provider,
    { value: observabilityContext },
    children
  );
exports.ObservabilityProvider = ObservabilityProvider;
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
const useObservability = () => {
  return (0, react_1.useContext)(exports.ObservabilityContext);
};
exports.useObservability = useObservability;
//# sourceMappingURL=ObservabilityContext.js.map
