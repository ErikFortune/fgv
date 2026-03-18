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

/**
 * Lightweight group header for visually separating ingredients by role.
 * @packageDocumentation
 */

import React from 'react';

/**
 * Props for {@link RoleGroupHeader}.
 * @public
 */
export interface IRoleGroupHeaderProps {
  /** Group label (title-cased role). When `undefined`, renders nothing (default/ungrouped). */
  readonly label: string | undefined;
  /** Additional CSS classes. */
  readonly className?: string;
}

/**
 * Renders a lightweight visual separator with a role label.
 * Returns `null` when `label` is `undefined` (the default/ungrouped group).
 * @public
 */
export function RoleGroupHeader({ label, className }: IRoleGroupHeaderProps): React.ReactElement | null {
  if (label === undefined) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 py-1 ${className ?? ''}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
