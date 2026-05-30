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

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { type MessageLogLevel } from '@fgv/ts-utils';

import { createMessage, ICreateMessageOptions, IMessage } from './model';

// ============================================================================
// Context Value
// ============================================================================

/**
 * Value provided by the MessagesContext.
 * @public
 */
export interface IMessagesContextValue {
  /** All messages in the stream (newest last) */
  readonly messages: ReadonlyArray<IMessage>;
  /**
   * Add a message to the stream. The `level` drives filtering; pass `options.severity`
   * only to override display styling (e.g. `'success'`).
   */
  readonly addMessage: (level: MessageLogLevel, text: string, options?: ICreateMessageOptions) => IMessage;
  /** Dismiss a specific message (removes from toast display, keeps in log) */
  readonly dismissMessage: (id: string) => void;
  /** Clear all messages */
  readonly clearMessages: () => void;
  /** Messages currently visible as toasts (not yet dismissed) */
  readonly activeToasts: ReadonlyArray<IMessage>;
}

// ============================================================================
// Context
// ============================================================================

const MessagesContext: React.Context<IMessagesContextValue | undefined> = React.createContext<
  IMessagesContextValue | undefined
>(undefined);

// ============================================================================
// Provider
// ============================================================================

/**
 * Props for the MessagesProvider.
 * @public
 */
export interface IMessagesProviderProps {
  /** Maximum number of messages to retain in the log */
  readonly maxMessages?: number;
  /** Children */
  readonly children: React.ReactNode;
}

/**
 * URL of the setup-instructions anchor surfaced by the Tailwind-content-path
 * diagnostic message when the probe detects that ts-app-shell's geometry utilities
 * are not being generated.
 * @internal
 */
export const TAILWIND_SETUP_DOCS_URL: string =
  'https://github.com/ErikFortune/fgv/tree/release/libraries/ts-app-shell#setup';

/**
 * Text of the diagnostic message emitted by the Tailwind-content-path probe.
 * @internal
 */
export const TAILWIND_PROBE_MESSAGE_TEXT: string =
  '@fgv/ts-app-shell styles are not fully loaded. Some icons may not render correctly. ' +
  'See setup docs for the required Tailwind content-path entry.';

/**
 * Provides the global message stream to the component tree.
 *
 * On mount, runs a one-shot probe that detects whether the consuming app's Tailwind
 * configuration is missing the `@fgv/ts-app-shell` content path. If the probe finds
 * that `h-3.5` does not resolve to a sized element, a `'warning'` message is appended
 * to the stream with a link to the setup documentation. The probe runs exactly once
 * per provider lifecycle (idempotent under React.StrictMode double-render and HMR)
 * and uses inline styles so it is not affected by the failure mode it detects.
 * @public
 */
export function MessagesProvider(props: IMessagesProviderProps): React.ReactElement {
  const { maxMessages = 200, children } = props;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const probeHasRun: React.MutableRefObject<boolean> = useRef<boolean>(false);

  const addMessage = useCallback(
    (level: MessageLogLevel, text: string, options?: ICreateMessageOptions): IMessage => {
      const msg = createMessage(level, text, options);
      setMessages((prev) => {
        const next = [...prev, msg];
        return next.length > maxMessages ? next.slice(next.length - maxMessages) : next;
      });
      return msg;
    },
    [maxMessages]
  );

  const dismissMessage = useCallback((id: string): void => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  const clearMessages = useCallback((): void => {
    setMessages([]);
    setDismissedIds(new Set());
  }, []);

  const activeToasts = useMemo(
    () => messages.filter((m) => !dismissedIds.has(m.id)),
    [messages, dismissedIds]
  );

  useEffect(() => {
    if (probeHasRun.current) {
      return;
    }
    probeHasRun.current = true;

    const probe: HTMLDivElement = document.createElement('div');
    probe.className = 'h-3.5';
    probe.setAttribute('aria-hidden', 'true');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    document.body.appendChild(probe);

    const frameId: number = requestAnimationFrame(() => {
      const height: number = probe.getBoundingClientRect().height;
      probe.remove();
      if (height === 0) {
        addMessage('warning', TAILWIND_PROBE_MESSAGE_TEXT, {
          action: {
            label: 'Open setup docs',
            href: TAILWIND_SETUP_DOCS_URL
          }
        });
      }
    });

    return (): void => {
      cancelAnimationFrame(frameId);
      if (probe.parentNode !== null) {
        probe.remove();
      }
    };
  }, [addMessage]);

  const value = useMemo<IMessagesContextValue>(
    () => ({
      messages,
      addMessage,
      dismissMessage,
      clearMessages,
      activeToasts
    }),
    [messages, addMessage, dismissMessage, clearMessages, activeToasts]
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the messages context.
 * Must be used within a MessagesProvider.
 * @public
 */
export function useMessages(): IMessagesContextValue {
  const ctx = useContext(MessagesContext);
  if (ctx === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return ctx;
}
