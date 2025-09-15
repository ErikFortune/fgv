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

import { useMemo, useEffect } from 'react';
import { useObservability } from '../contexts';
import { useViewState } from './useViewState';
import {
  detectObservabilityContextType,
  isViewStateConnected,
  isConsoleOnlyContext,
  createViewStateObservabilityContext
} from '../utils/observability';
import type { IObservabilityContext, ObservabilityContextType } from '../utils/observability';

/**
 * Smart observability hook that automatically provides the best available observability context.
 *
 * This hook detects the current observability context type and:
 * - Uses ViewState-connected context when available (best experience)
 * - Auto-creates ViewState connection when only console context is available
 * - Preserves custom contexts provided by consumers
 * - Provides helpful warnings for suboptimal configurations
 *
 * @returns The most appropriate observability context for the current component tree
 *
 * @example
 * ```tsx
 * // In a component that needs user feedback in the UI
 * const MyComponent = () => {
 *   const o11y = useSmartObservability();
 *
 *   const handleAction = () => {
 *     o11y.user.success('Action completed successfully!');
 *   };
 *
 *   return <button onClick={handleAction}>Do Something</button>;
 * };
 * ```
 *
 * @public
 */
export function useSmartObservability(): IObservabilityContext {
  const existingContext = useObservability();
  const viewState = useViewState();

  const contextType = useMemo(() => detectObservabilityContextType(existingContext), [existingContext]);

  const smartContext = useMemo(() => {
    // If we already have ViewState connection or custom context, use it
    if (contextType === 'viewstate' || contextType === 'custom') {
      return existingContext;
    }

    // If we only have console context but ViewState is available, upgrade
    if (contextType === 'console' && viewState) {
      return createViewStateObservabilityContext(viewState.addMessage);
    }

    // Fallback to existing context (console-only)
    return existingContext;
  }, [contextType, existingContext, viewState]);

  // Provide helpful warnings for suboptimal usage
  useEffect(() => {
    if (contextType === 'console') {
      if (viewState) {
        // We auto-upgraded to ViewState, inform developer about better patterns
        console.info(
          `
🔄 Smart Observability: Auto-created ViewState connection
   User feedback will now appear in UI messages window.
   
   For better performance, consider wrapping your component in:
   • ResourceOrchestrator (recommended for full app integration)
   • ObservabilityProvider with ViewState context
   
   Example:
   <ObservabilityProvider observabilityContext={
     ObservabilityTools.createViewStateObservabilityContext(viewState.addMessage)
   }>
     <YourComponent />
   </ObservabilityProvider>
        `.trim()
        );
      } else {
        // No ViewState available, warn about limited functionality
        console.warn(
          `
⚠️  Smart Observability: Console-only context detected
    User feedback will only appear in browser console.
    
    To show user feedback in UI messages window:
    1. Use ViewStateTools.useViewState() in a parent component
    2. Wrap your component tree in ObservabilityProvider with ViewState context
    
    Example:
    const App = () => {
      const viewState = ViewStateTools.useViewState();
      const o11y = ObservabilityTools.createViewStateObservabilityContext(viewState.addMessage);
      
      return (
        <ObservabilityProvider observabilityContext={o11y}>
          <YourComponent />
        </ObservabilityProvider>
      );
    };
        `.trim()
        );
      }
    }
  }, [contextType, viewState]);

  return smartContext;
}

/**
 * Hook that provides smart observability context with additional debugging information.
 * Useful for development and troubleshooting observability setup.
 *
 * @returns Object containing the smart context and debug information
 *
 * @example
 * ```tsx
 * const MyDebugComponent = () => {
 *   const { context: o11y, debugInfo } = useSmartObservabilityDebug();
 *
 *   console.log('Context type:', debugInfo.contextType);
 *   console.log('ViewState available:', debugInfo.hasViewState);
 *   console.log('Auto-upgraded:', debugInfo.wasUpgraded);
 *
 *   return <div>Check console for observability debug info</div>;
 * };
 * ```
 *
 * @public
 */
export function useSmartObservabilityDebug(): {
  context: IObservabilityContext;
  debugInfo: {
    contextType: ObservabilityContextType;
    hasViewState: boolean;
    wasUpgraded: boolean;
    isViewStateConnected: boolean;
    isConsoleOnly: boolean;
  };
} {
  const existingContext = useObservability();
  const viewState = useViewState();
  const smartContext = useSmartObservability();

  const debugInfo = useMemo(() => {
    const contextType = detectObservabilityContextType(existingContext);
    const hasViewState = Boolean(viewState);
    const wasUpgraded = contextType === 'console' && hasViewState;

    return {
      contextType,
      hasViewState,
      wasUpgraded,
      isViewStateConnected: isViewStateConnected(smartContext),
      isConsoleOnly: isConsoleOnlyContext(existingContext)
    };
  }, [existingContext, viewState, smartContext]);

  return {
    context: smartContext,
    debugInfo
  };
}
