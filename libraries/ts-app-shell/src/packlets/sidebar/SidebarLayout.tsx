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
 * Props for the SidebarLayout component.
 * @public
 */
export interface ISidebarLayoutProps {
  /** Sidebar content (filter bar, collection section, etc.) */
  readonly sidebar: React.ReactNode;
  /** Main content area */
  readonly children: React.ReactNode;
  /** Sidebar width in CSS units (default: '280px') */
  readonly sidebarWidth?: string;
}

/**
 * Layout component that renders a persistent left sidebar alongside a main content area.
 * The sidebar is a fixed-width panel; the main content fills the remaining space.
 * @public
 */
export function SidebarLayout(props: ISidebarLayoutProps): React.ReactElement {
  const { sidebar, children, sidebarWidth = '280px' } = props;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r border-gray-200 bg-white overflow-y-auto shrink-0"
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>

      {/* Main content — overflow-hidden so flex-1 constrains height down the chain */}
      <div className="flex flex-col flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
