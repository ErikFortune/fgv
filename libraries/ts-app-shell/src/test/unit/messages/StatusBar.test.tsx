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

import { Logging } from '@fgv/ts-utils';
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import { ResponsiveProvider, type LayoutMode } from '../../../packlets/responsive';
import { createMessage, type IMessage, StatusBar } from '../../../packlets/messages';

// One message per canonical level, plus an explicit-severity success message (level info).
const sample: ReadonlyArray<IMessage> = [
  createMessage('quiet', 'quiet-msg'),
  createMessage('detail', 'detail-msg'),
  createMessage('info', 'info-msg'),
  createMessage('warning', 'warn-msg'),
  createMessage('error', 'error-msg'),
  createMessage('info', 'success-msg', { severity: 'success' })
];

function renderBar(options?: {
  messages?: ReadonlyArray<IMessage>;
  onClear?: () => void;
  layout?: LayoutMode;
  initialFilterLevel?: Logging.ReporterLogLevel;
}): HTMLElement {
  const { container } = render(
    <ResponsiveProvider forceLayoutMode={options?.layout ?? 'full'}>
      <StatusBar
        messages={options?.messages ?? sample}
        onClear={options?.onClear ?? jest.fn()}
        initialFilterLevel={options?.initialFilterLevel}
      />
    </ResponsiveProvider>
  );
  return container;
}

/** Clicks the collapsed bar toggle (the first button) to expand the panel. */
function expand(container: HTMLElement): void {
  const toggle = container.querySelector('button');
  if (toggle === null) {
    throw new Error('expected a collapsed toggle button');
  }
  fireEvent.click(toggle);
}

function openFilters(): void {
  fireEvent.click(screen.getByTitle('Filter messages'));
}

function setupClipboard(writeText: jest.Mock): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true
  });
}

describe('StatusBar', () => {
  afterEach(cleanup);

  describe('collapsed bar', () => {
    test('shows the no-messages hint when the stream is empty', () => {
      renderBar({ messages: [] });
      expect(screen.getByText('No messages')).not.toBeNull();
    });

    test('expanded empty panel shows the unfiltered no-messages hint', () => {
      const container = renderBar({ messages: [] });
      expand(container);
      // Collapsed bar hint + the expanded-panel hint (isFiltered === false branch).
      expect(screen.getAllByText('No messages').length).toBeGreaterThanOrEqual(2);
    });

    test('counts by effective severity (derived level + explicit success)', () => {
      // info-msg (derived info) + success-msg (explicit success) + warn + error + quiet/detail (derived info)
      const container = renderBar();
      const toggle = container.querySelector('button');
      if (toggle === null) {
        throw new Error('expected a collapsed toggle button');
      }
      // info bucket: quiet, detail, info → 3; success → 1; warning → 1; error → 1
      expect(toggle.textContent).toContain('3');
      expect(toggle.textContent).toContain('1');
    });
  });

  describe('level filtering', () => {
    test.each<[string, ReadonlyArray<string>, ReadonlyArray<string>]>([
      ['All', ['quiet-msg', 'detail-msg', 'info-msg', 'warn-msg', 'error-msg', 'success-msg'], []],
      ['Detail+', ['detail-msg', 'info-msg', 'warn-msg', 'error-msg', 'success-msg'], ['quiet-msg']],
      ['Info+', ['info-msg', 'warn-msg', 'error-msg', 'success-msg'], ['quiet-msg', 'detail-msg']],
      ['Warn+', ['warn-msg', 'error-msg'], ['info-msg', 'detail-msg', 'quiet-msg', 'success-msg']],
      ['Error', ['error-msg'], ['warn-msg', 'info-msg', 'detail-msg', 'quiet-msg', 'success-msg']]
    ])('filters at the %s threshold via shouldLog', (label, visible, hidden) => {
      const container = renderBar();
      expand(container);
      openFilters();
      fireEvent.click(screen.getByText(label));

      for (const text of visible) {
        expect(screen.getByText(text)).not.toBeNull();
      }
      for (const text of hidden) {
        expect(screen.queryByText(text)).toBeNull();
      }
    });

    test('honors the initialFilterLevel prop', () => {
      const container = renderBar({ initialFilterLevel: 'error' });
      expand(container);
      expect(screen.getByText('error-msg')).not.toBeNull();
      expect(screen.queryByText('info-msg')).toBeNull();
      // header reflects the filtered subset
      expect(screen.getByText(/1 of 6 messages/)).not.toBeNull();
    });

    test('Detail+ surfaces detail-level messages the old severity filter could not represent', () => {
      const container = renderBar();
      expand(container);
      openFilters();
      fireEvent.click(screen.getByText('Detail+'));
      expect(screen.getByText('detail-msg')).not.toBeNull();
    });
  });

  describe('search', () => {
    test('filters by case-insensitive substring and can be cleared', () => {
      const container = renderBar();
      expand(container);
      openFilters();

      const input = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(input, { target: { value: 'WARN' } });
      expect(screen.getByText('warn-msg')).not.toBeNull();
      expect(screen.queryByText('info-msg')).toBeNull();

      fireEvent.click(screen.getByLabelText('Clear search'));
      expect(screen.getByText('info-msg')).not.toBeNull();
    });

    test('shows the no-match hint when the filter excludes everything', () => {
      const container = renderBar();
      expand(container);
      openFilters();
      const input = screen.getByPlaceholderText('Search messages...');
      fireEvent.change(input, { target: { value: 'zzz-no-match' } });
      expect(screen.getByText('No messages match the current filter')).not.toBeNull();
    });
  });

  describe('styling', () => {
    test('renders the explicit success message with success styling in the log row', () => {
      const container = renderBar({ messages: [createMessage('info', 'saved!', { severity: 'success' })] });
      expand(container);
      const row = screen.getByText('saved!').closest('div');
      expect(row?.className).toContain('status-success');
    });
  });

  describe('clipboard', () => {
    test('copies a single message and surfaces the Copied! affordance', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      setupClipboard(writeText);

      const container = renderBar({ messages: [createMessage('info', 'copy-me')] });
      expand(container);
      fireEvent.click(screen.getByTitle('Copy message'));

      expect(writeText).toHaveBeenCalledWith('copy-me');
      await waitFor(() => expect(screen.getByTitle('Copied!')).not.toBeNull());
    });

    test('copies all filtered messages tagged by canonical level', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      setupClipboard(writeText);

      const container = renderBar({
        messages: [createMessage('warning', 'first'), createMessage('error', 'second')]
      });
      expand(container);
      fireEvent.click(screen.getByTitle('Copy filtered messages'));

      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
      const copied = writeText.mock.calls[0][0] as string;
      expect(copied).toContain('[WARNING]');
      expect(copied).toContain('[ERROR]');
      expect(copied).toContain('first');
      expect(copied).toContain('second');
      // The copy-all control surfaces its own Copied! affordance.
      await waitFor(() => expect(screen.getByTitle('Copied!')).not.toBeNull());
    });

    test('swallows clipboard write rejections without throwing', async () => {
      const writeText = jest.fn().mockRejectedValue(new Error('denied'));
      setupClipboard(writeText);

      const container = renderBar({ messages: [createMessage('info', 'copy-me')] });
      expand(container);
      fireEvent.click(screen.getByTitle('Copy message'));

      await waitFor(() => expect(writeText).toHaveBeenCalled());
      // Copied! affordance never appears because the promise rejected.
      expect(screen.queryByTitle('Copied!')).toBeNull();
    });
  });

  describe('controls', () => {
    test('invokes onClear when the Clear button is pressed', () => {
      const onClear = jest.fn();
      const container = renderBar({ onClear });
      expand(container);
      fireEvent.click(screen.getByText('Clear'));
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    test('collapsing hides the message panel', () => {
      const container = renderBar();
      expand(container);
      expect(screen.getByText('info-msg')).not.toBeNull();
      expand(container); // toggle back to collapsed
      expect(screen.queryByText('info-msg')).toBeNull();
    });
  });

  describe('mobile layout', () => {
    test('renders the backdrop and closes the panel when it is clicked', () => {
      const container = renderBar({ layout: 'mobile' });
      expand(container);
      expect(screen.getByText('info-msg')).not.toBeNull();

      const backdrop = container.querySelector('.bg-backdrop');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop as Element);
      expect(screen.queryByText('info-msg')).toBeNull();
    });
  });

  describe('header summary', () => {
    test('shows the plain message count when nothing is filtered', () => {
      const container = renderBar();
      expand(container);
      expect(within(container).getByText(/^6 messages$/)).not.toBeNull();
    });
  });
});
