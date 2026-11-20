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
import { act, cleanup, render, renderHook } from '@testing-library/react';

import {
  type IMessagesContextValue,
  MessagesProvider,
  TAILWIND_PROBE_CLASS,
  useMessages
} from '../../../packlets/messages';

/**
 * Replaces `requestAnimationFrame` with a synchronous flushable queue. Tests can call the
 * returned `flush()` to run pending callbacks inside `act()`.
 */
function installSyncRaf(): { flush: () => void; restore: () => void } {
  const pending: FrameRequestCallback[] = [];
  const originalRaf = window.requestAnimationFrame;
  const originalCaf = window.cancelAnimationFrame;
  let nextId = 1;
  const handles = new Map<number, FrameRequestCallback>();
  window.requestAnimationFrame = ((cb: FrameRequestCallback): number => {
    const id = nextId++;
    handles.set(id, cb);
    pending.push(cb);
    return id;
  }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = ((id: number): void => {
    const cb = handles.get(id);
    if (cb !== undefined) {
      handles.delete(id);
      const index = pending.indexOf(cb);
      if (index >= 0) {
        pending.splice(index, 1);
      }
    }
  }) as typeof window.cancelAnimationFrame;
  return {
    flush: (): void => {
      const callbacks = pending.splice(0, pending.length);
      for (const cb of callbacks) {
        cb(performance.now());
      }
    },
    restore: (): void => {
      window.requestAnimationFrame = originalRaf;
      window.cancelAnimationFrame = originalCaf;
    }
  };
}

/**
 * Stubs `getBoundingClientRect` on `HTMLElement.prototype` to return the supplied height
 * for elements that carry the sentinel probe class — simulating a correctly-configured
 * Tailwind build (jsdom does not run layout, so a stylesheet alone is not observable).
 */
function installProbeSizing(height: number): { restore: () => void } {
  const original = HTMLElement.prototype.getBoundingClientRect;
  const replacement = function (this: HTMLElement): DOMRect {
    const sized = this.classList.contains(TAILWIND_PROBE_CLASS);
    return {
      x: 0,
      y: 0,
      width: 0,
      height: sized ? height : 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => ({})
    } as DOMRect;
  };
  HTMLElement.prototype.getBoundingClientRect = replacement;
  return {
    restore: (): void => {
      HTMLElement.prototype.getBoundingClientRect = original;
    }
  };
}

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

    let returned: ReturnType<IMessagesContextValue['addMessage']> | undefined;
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

  describe('Tailwind content-path probe', () => {
    test('emits one warning message with the setup-docs href when the probe measures 0', () => {
      const raf = installSyncRaf();
      try {
        const { result } = renderMessages();
        expect(result.current.messages).toHaveLength(0);

        act(() => {
          raf.flush();
        });

        expect(result.current.messages).toHaveLength(1);
        const msg = result.current.messages[0];
        expect(msg.level).toBe('warning');
        expect(msg.text).toMatch(/styles are not fully loaded/i);
        expect(msg.action?.href).toBe(
          'https://github.com/ErikFortune/fgv/tree/release/libraries/ts-app-shell#setup'
        );
        expect(msg.action?.label).toBe('Open setup docs');
      } finally {
        raf.restore();
      }
    });

    test('emits no message when the sentinel class sizes the probe (Tailwind correctly configured)', () => {
      const raf = installSyncRaf();
      const sizing = installProbeSizing(14);
      try {
        const { result } = renderMessages();
        act(() => {
          raf.flush();
        });
        expect(result.current.messages).toHaveLength(0);
      } finally {
        sizing.restore();
        raf.restore();
      }
    });

    test('is idempotent when the effect re-fires (e.g. addMessage identity changes)', () => {
      const raf = installSyncRaf();
      try {
        let captured: IMessagesContextValue | undefined;
        function Capture(): null {
          captured = useMessages();
          return null;
        }
        function Harness({ maxMessages }: { maxMessages: number }): React.ReactElement {
          return (
            <MessagesProvider maxMessages={maxMessages}>
              <Capture />
            </MessagesProvider>
          );
        }

        const { rerender } = render(<Harness maxMessages={100} />);
        act(() => {
          raf.flush();
        });
        expect(captured?.messages).toHaveLength(1);

        // Re-rendering with a different maxMessages invalidates addMessage's useCallback
        // memo; the probe effect's deps change and it re-fires. The probeHasRun ref must
        // suppress the second probe so exactly one warning lands.
        rerender(<Harness maxMessages={50} />);
        act(() => {
          raf.flush();
        });
        expect(captured?.messages).toHaveLength(1);
      } finally {
        raf.restore();
      }
    });

    test('still fires under React.StrictMode (cleanup-before-rAF must not poison the guard)', () => {
      const raf = installSyncRaf();
      try {
        let captured: IMessagesContextValue | undefined;
        function Capture(): null {
          captured = useMessages();
          return null;
        }
        render(
          <React.StrictMode>
            <MessagesProvider>
              <Capture />
            </MessagesProvider>
          </React.StrictMode>
        );
        act(() => {
          raf.flush();
        });
        // StrictMode runs setup → cleanup → setup on mount. The first cleanup cancels the
        // scheduled rAF before measurement; if the guard had been set eagerly the second
        // setup would short-circuit and the diagnostic would never run. Exactly one warning
        // must land.
        expect(captured?.messages).toHaveLength(1);
        expect(captured?.messages[0].level).toBe('warning');
      } finally {
        raf.restore();
      }
    });

    test('cancels the scheduled measurement and removes the probe element on unmount', () => {
      const raf = installSyncRaf();
      try {
        const { result, unmount } = renderHook(() => useMessages(), { wrapper: wrapper() });
        const findProbe = (): Element | undefined =>
          Array.from(document.body.children).find(
            (el) => el.tagName === 'DIV' && el.className === TAILWIND_PROBE_CLASS
          );
        expect(findProbe()).not.toBeUndefined();

        unmount();

        // The rAF callback should be cancelled and the probe removed; no message lands
        // even after a flush attempt.
        act(() => {
          raf.flush();
        });
        expect(result.current.messages).toHaveLength(0);
        expect(findProbe()).toBeUndefined();
      } finally {
        raf.restore();
      }
    });
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
