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

import { type IMessage, MessagesProvider, useLogReporter, useMessages } from '../../../packlets/messages';
import { type Logging } from '@fgv/ts-utils';

interface IHarness {
  readonly reporter: Logging.LogReporter<unknown>;
  readonly messages: ReadonlyArray<IMessage>;
}

function wrapper(): React.FC<{ children: React.ReactNode }> {
  return ({ children }) => <MessagesProvider>{children}</MessagesProvider>;
}

describe('useLogReporter', () => {
  afterEach(cleanup);

  test('reporter routes logged levels into the MessagesContext losslessly', () => {
    const { result } = renderHook(
      (): IHarness => ({
        reporter: useLogReporter({ logLevel: 'all' }),
        messages: useMessages().messages
      }),
      { wrapper: wrapper() }
    );

    act(() => {
      result.current.reporter.detail('verbose');
      result.current.reporter.warn('careful');
    });

    expect(result.current.messages.map((m) => m.level)).toEqual(['detail', 'warning']);
    expect(result.current.messages.every((m) => m.severity === undefined)).toBe(true);
  });

  test('reporter respects the default info threshold', () => {
    const { result } = renderHook(
      (): IHarness => ({
        reporter: useLogReporter(),
        messages: useMessages().messages
      }),
      { wrapper: wrapper() }
    );

    act(() => {
      result.current.reporter.detail('hidden');
      result.current.reporter.info('shown');
    });

    expect(result.current.messages.map((m) => m.level)).toEqual(['info']);
  });

  test('returns a stable reporter across re-renders with the same level', () => {
    const { result, rerender } = renderHook(() => useLogReporter({ logLevel: 'info' }), {
      wrapper: wrapper()
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
