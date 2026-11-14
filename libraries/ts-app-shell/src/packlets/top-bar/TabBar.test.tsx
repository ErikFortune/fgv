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
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { TabBar, type ITabConfig } from './TabBar';

describe('TabBar', () => {
  type TabId = 'overview' | 'details' | 'settings';

  function renderTabBar(
    tabs: ReadonlyArray<ITabConfig<TabId>>,
    activeTab: TabId = 'overview'
  ): {
    readonly onTabChange: jest.Mock<void, [TabId]>;
  } {
    const onTabChange = jest.fn<void, [TabId]>();

    render(<TabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />);

    return { onTabChange };
  }

  it('renders labels without badges and calls the change handler when clicked', async () => {
    const user = userEvent.setup();
    const { onTabChange } = renderTabBar([
      { id: 'overview', label: 'Overview' },
      { id: 'details', label: 'Details' }
    ]);

    expect(screen.getByRole('button', { name: 'Overview' })).toHaveTextContent('Overview');
    expect(screen.getByRole('button', { name: 'Details' })).toHaveTextContent('Details');
    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Details' })).not.toHaveAttribute('aria-current');

    await user.click(screen.getByRole('button', { name: 'Details' }));

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('details');
  });

  it('renders a dot badge with accessible label and warning tone classes', () => {
    renderTabBar([
      {
        id: 'overview',
        label: 'Overview',
        badge: {
          kind: 'dot',
          tone: 'warning',
          ariaLabel: 'Overview has updates'
        }
      }
    ]);

    const button = screen.getByRole('button');
    const badge = within(button).getByLabelText('Overview has updates');

    expect(button).toHaveTextContent('Overview');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('h-2', 'w-2', 'bg-status-warning-icon');
  });

  it('renders a count badge with a default info tone and count text', () => {
    renderTabBar([
      {
        id: 'overview',
        label: 'Overview',
        badge: {
          kind: 'count',
          count: 7,
          ariaLabel: '7 pending items'
        }
      }
    ]);

    const button = screen.getByRole('button');
    const badge = within(button).getByLabelText('7 pending items');

    expect(button).toHaveTextContent('Overview');
    expect(button).toHaveTextContent('7');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('min-w-4', 'bg-status-info-bg', 'text-status-info-text');
  });
});
