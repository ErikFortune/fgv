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
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ResponsiveProvider, type LayoutMode } from '../../../packlets/responsive';
import { createMessage, type IMessage, ToastContainer, ToastItem } from '../../../packlets/messages';

function renderToast(message: IMessage, onDismiss: (id: string) => void, layout: LayoutMode = 'full'): void {
  render(
    <ResponsiveProvider forceLayoutMode={layout}>
      <ToastItem message={message} onDismiss={onDismiss} />
    </ResponsiveProvider>
  );
}

describe('Toast', () => {
  afterEach(cleanup);

  describe('ToastItem', () => {
    test('styles via the severity derived from the level when no override is present', () => {
      renderToast(createMessage('error', 'kaboom'), jest.fn());
      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('status-error');
    });

    test('honors an explicit success severity styling override', () => {
      renderToast(createMessage('info', 'saved!', { severity: 'success' }), jest.fn());
      const alert = screen.getByRole('alert');
      expect(alert.className).toContain('status-success');
    });

    test('auto-dismisses based on the derived severity toast config', () => {
      jest.useFakeTimers();
      try {
        const onDismiss = jest.fn();
        const msg = createMessage('info', 'transient'); // info → 3000ms
        renderToast(msg, onDismiss);

        expect(onDismiss).not.toHaveBeenCalled();
        act(() => {
          jest.advanceTimersByTime(3000);
        });
        expect(onDismiss).toHaveBeenCalledWith(msg.id);
      } finally {
        jest.useRealTimers();
      }
    });

    test('does not auto-dismiss when the config duration is zero (errors persist)', () => {
      jest.useFakeTimers();
      try {
        const onDismiss = jest.fn();
        renderToast(createMessage('error', 'sticky'), onDismiss);

        act(() => {
          jest.advanceTimersByTime(60000);
        });
        expect(onDismiss).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    test('renders and triggers an attached action', () => {
      const onAction = jest.fn();
      renderToast(createMessage('error', 'failed', { action: { label: 'Retry', onAction } }), jest.fn());

      fireEvent.click(screen.getByText('Retry'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    test('dismiss button invokes onDismiss with the message id', () => {
      const onDismiss = jest.fn();
      const msg = createMessage('warning', 'heads up');
      renderToast(msg, onDismiss);

      fireEvent.click(screen.getByLabelText('Dismiss'));
      expect(onDismiss).toHaveBeenCalledWith(msg.id);
    });
  });

  describe('ToastContainer', () => {
    function renderContainer(
      toasts: ReadonlyArray<IMessage>,
      layout: LayoutMode = 'full',
      maxVisible?: number
    ): HTMLElement | null {
      const { container } = render(
        <ResponsiveProvider forceLayoutMode={layout}>
          <ToastContainer toasts={toasts} onDismiss={jest.fn()} maxVisible={maxVisible} />
        </ResponsiveProvider>
      );
      return container.firstElementChild as HTMLElement | null;
    }

    test('renders nothing when there are no toasts', () => {
      expect(renderContainer([])).toBeNull();
    });

    test('shows only the most recent maxVisible toasts', () => {
      const toasts = [
        createMessage('info', 'one'),
        createMessage('info', 'two'),
        createMessage('info', 'three')
      ];
      renderContainer(toasts, 'full', 2);
      expect(screen.queryByText('one')).toBeNull();
      expect(screen.getByText('two')).not.toBeNull();
      expect(screen.getByText('three')).not.toBeNull();
    });

    test('uses the desktop positioning class in full layout', () => {
      const root = renderContainer([createMessage('info', 'x')], 'full');
      expect(root?.className).toContain('right-4');
      expect(root?.className).not.toContain('left-4');
    });

    test('uses the mobile positioning class in mobile layout', () => {
      const root = renderContainer([createMessage('info', 'x')], 'mobile');
      expect(root?.className).toContain('left-4');
      expect(root?.className).toContain('right-4');
    });
  });
});
