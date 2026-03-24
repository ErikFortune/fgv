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

import React, { useEffect } from 'react';
import { useResponsive } from '../responsive';

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
  /** Whether the sidebar drawer is open (compact/mobile only). */
  readonly isSidebarOpen?: boolean;
  /** Called when the drawer should close (backdrop click, etc.). */
  readonly onSidebarClose?: () => void;
}

/**
 * Layout component that renders a persistent left sidebar alongside a main content area.
 *
 * On `full` layout mode, the sidebar is a fixed-width panel.
 * On `compact` and `mobile` layout modes, the sidebar becomes a slide-out drawer
 * controlled by {@link ISidebarLayoutProps.isSidebarOpen | isSidebarOpen} and
 * {@link ISidebarLayoutProps.onSidebarClose | onSidebarClose}.
 * @public
 */
export function SidebarLayout(props: ISidebarLayoutProps): React.ReactElement {
  const { sidebar, children, sidebarWidth = '280px', isSidebarOpen = false, onSidebarClose } = props;
  const { layoutMode } = useResponsive();
  const isDrawer = layoutMode !== 'full';

  // Close drawer on Escape key
  useEffect(() => {
    if (!isDrawer || !isSidebarOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onSidebarClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawer, isSidebarOpen, onSidebarClose]);

  // Full mode: static sidebar
  if (!isDrawer) {
    return (
      <div className="flex flex-1 overflow-hidden">
        <aside
          className="flex flex-col border-r border-border bg-surface overflow-y-auto shrink-0"
          style={{ width: sidebarWidth }}
        >
          {sidebar}
        </aside>
        <div className="flex flex-col flex-1 overflow-hidden">{children}</div>
      </div>
    );
  }

  // Compact/mobile: drawer overlay
  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {/* Main content — always visible */}
      <div className="flex flex-col flex-1 overflow-hidden">{children}</div>

      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-backdrop z-40 transition-opacity"
          onClick={onSidebarClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-border overflow-y-auto shadow-lg transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>
    </div>
  );
}
