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

import React, { useCallback, useContext, useMemo, useState } from 'react';

import { createMessage, IMessage, IMessageAction, MessageSeverity } from './model';

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
  /** Add a message to the stream */
  readonly addMessage: (severity: MessageSeverity, text: string, action?: IMessageAction) => IMessage;
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
 * Provides the global message stream to the component tree.
 * @public
 */
export function MessagesProvider(props: IMessagesProviderProps): React.ReactElement {
  const { maxMessages = 200, children } = props;
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const addMessage = useCallback(
    (severity: MessageSeverity, text: string, action?: IMessageAction): IMessage => {
      const msg = createMessage(severity, text, action);
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
