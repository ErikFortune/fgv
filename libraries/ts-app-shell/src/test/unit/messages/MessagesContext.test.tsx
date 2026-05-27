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

import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';

import { type IMessagesContextValue, MessagesProvider, useMessages } from '../../../packlets/messages';

function wrapper(maxMessages?: number): React.FC<{ children: React.ReactNode }> {
  return ({ children }) => <MessagesProvider maxMessages={maxMessages}>{children}</MessagesProvider>;
}

function renderMessages(maxMessages?: number): { result: { current: IMessagesContextValue } } {
  return renderHook(() => useMessages(), { wrapper: wrapper(maxMessages) });
}

describe('MessagesContext', () => {
  afterEach(cleanup);

  test('useMessages throws when used outside a provider', () => {
    expect(() => renderHook(() => useMessages())).toThrow(/within a MessagesProvider/i);
  });

  test('addMessage appends a message carrying the supplied level and returns it', () => {
    const { result } = renderMessages();

    let returned;
    act(() => {
      returned = result.current.addMessage('warning', 'low disk');
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].level).toBe('warning');
    expect(result.current.messages[0].severity).toBeUndefined();
    expect(returned).toBe(result.current.messages[0]);
  });

  test('addMessage forwards an explicit severity styling override', () => {
    const { result } = renderMessages();

    act(() => {
      result.current.addMessage('info', 'saved', { severity: 'success' });
    });

    expect(result.current.messages[0].severity).toBe('success');
  });

  test('retains at most maxMessages, dropping the oldest', () => {
    const { result } = renderMessages(2);

    act(() => {
      result.current.addMessage('info', 'first');
      result.current.addMessage('info', 'second');
      result.current.addMessage('info', 'third');
    });

    expect(result.current.messages.map((m) => m.text)).toEqual(['second', 'third']);
  });

  test('dismissMessage removes a message from activeToasts but keeps it in the log', () => {
    const { result } = renderMessages();

    let id = '';
    act(() => {
      id = result.current.addMessage('info', 'toast me').id;
    });
    expect(result.current.activeToasts).toHaveLength(1);

    act(() => {
      result.current.dismissMessage(id);
    });

    expect(result.current.activeToasts).toHaveLength(0);
    expect(result.current.messages).toHaveLength(1);
  });

  test('clearMessages empties both the log and the active toasts', () => {
    const { result } = renderMessages();

    act(() => {
      result.current.addMessage('info', 'a');
      result.current.addMessage('error', 'b');
    });
    expect(result.current.messages).toHaveLength(2);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.activeToasts).toHaveLength(0);
  });
});
