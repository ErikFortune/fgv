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

import '@fgv/ts-utils-jest';
import '@testing-library/jest-dom';

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ResponsiveProvider } from '@fgv/ts-app-shell';

import { CreateCollectionDialog } from '../../../packlets/sidebar';

describe('CreateCollectionDialog', () => {
  test('waits for async create before closing', async () => {
    let resolveCreate: (() => void) | undefined;
    const createPromise = new Promise<void>((resolve) => {
      resolveCreate = resolve;
    });

    const onCreate = jest.fn(async () => {
      await createPromise;
    });
    const onClose = jest.fn();

    render(
      <ResponsiveProvider forceLayoutMode="full">
        <CreateCollectionDialog
          isOpen={true}
          onClose={onClose}
          onCreate={onCreate}
          existingIds={new Set<string>()}
          existingSecretNames={[]}
        />
      </ResponsiveProvider>
    );

    fireEvent.change(screen.getByTestId('collections-create-name-input'), {
      target: { value: 'Test Confections' }
    });
    fireEvent.click(screen.getByTestId('collections-create-submit-button'));

    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      resolveCreate?.();
      await createPromise;
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
