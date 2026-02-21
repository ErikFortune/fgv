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

/**
 * Configuration for a single tab.
 * @public
 */
export interface ITabConfig<TTab extends string> {
  /** Tab identifier */
  readonly id: TTab;
  /** Display label */
  readonly label: string;
}

/**
 * Props for the TabBar component.
 * @public
 */
export interface ITabBarProps<TTab extends string> {
  /** Available tabs */
  readonly tabs: ReadonlyArray<ITabConfig<TTab>>;
  /** Currently active tab */
  readonly activeTab: TTab;
  /** Callback when a tab is selected */
  readonly onTabChange: (tab: TTab) => void;
  /** Optional content pinned to the far right of the tab bar */
  readonly rightContent?: React.ReactNode;
}

/**
 * Second-level tab bar for switching views within a mode.
 * @public
 */
export function TabBar<TTab extends string>(props: ITabBarProps<TTab>): React.ReactElement {
  const { tabs, activeTab, onTabChange, rightContent } = props;

  return (
    <div className="flex items-center gap-1 px-4 py-1 bg-choco-secondary text-white border-t border-white/10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={(): void => onTabChange(tab.id)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
      {rightContent !== undefined && (
        <>
          <div className="flex-1" />
          {rightContent}
        </>
      )}
    </div>
  );
}
