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
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CollectionSection, type ICollectionRowItem } from './CollectionSection';

describe('CollectionSection', () => {
  function renderSection(collections: ReadonlyArray<ICollectionRowItem>): void {
    render(<CollectionSection collections={collections} onToggleVisibility={jest.fn()} />);
  }

  it('renders a collection row without a badge', () => {
    renderSection([
      {
        id: 'alpha',
        name: 'Alpha',
        itemCount: 3,
        isMutable: false,
        isProtected: false,
        isUnlocked: false,
        isVisible: true,
        isDefault: false
      }
    ]);

    const row = screen.getByRole('button', { name: /Alpha/ });

    expect(row).toHaveTextContent('Alpha');
    expect(row).toHaveTextContent('3');
    expect(within(row).queryByLabelText('Alpha has updates')).not.toBeInTheDocument();
  });

  it('renders a dot badge with the configured tone and aria label', () => {
    renderSection([
      {
        id: 'alpha',
        name: 'Alpha',
        itemCount: 3,
        isMutable: false,
        isProtected: false,
        isUnlocked: false,
        isVisible: true,
        isDefault: false,
        badge: {
          kind: 'dot',
          tone: 'warning',
          ariaLabel: 'Alpha has updates'
        }
      }
    ]);

    const row = screen.getByRole('button', { name: /Alpha/ });
    const badge = within(row).getByLabelText('Alpha has updates');

    expect(row).toHaveTextContent('Alpha');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('h-2', 'w-2', 'bg-status-warning-bg', 'text-status-warning-text');
  });

  it('renders a count badge with the configured count and default info tone', () => {
    renderSection([
      {
        id: 'alpha',
        name: 'Alpha',
        itemCount: 3,
        isMutable: false,
        isProtected: false,
        isUnlocked: false,
        isVisible: true,
        isDefault: false,
        badge: {
          kind: 'count',
          count: 12,
          ariaLabel: '12 pending items'
        }
      }
    ]);

    const row = screen.getByRole('button', { name: /Alpha/ });
    const badge = within(row).getByLabelText('12 pending items');

    expect(row).toHaveTextContent('Alpha');
    expect(row).toHaveTextContent('12');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('min-w-4', 'bg-status-info-bg', 'text-status-info-text');
  });
});
