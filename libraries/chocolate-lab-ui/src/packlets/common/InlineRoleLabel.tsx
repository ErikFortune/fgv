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
 * Small inline pill/badge for showing ingredient role in compact views.
 * @packageDocumentation
 */

import React from 'react';
import type { IngredientRole } from '@fgv/ts-chocolate';

/**
 * Props for {@link InlineRoleLabel}.
 * @public
 */
export interface IInlineRoleLabelProps {
  /** The ingredient role. Returns `null` when `undefined`. */
  readonly role: IngredientRole | undefined;
}

/**
 * Renders a small pill/badge with the role label.
 * Returns `null` when `role` is `undefined`.
 * @public
 */
export function InlineRoleLabel({ role }: IInlineRoleLabelProps): React.ReactElement | null {
  if (role === undefined) {
    return null;
  }

  return (
    <span className="ml-1 text-[10px] text-gray-500 bg-gray-100 rounded px-1 py-0.5">{String(role)}</span>
  );
}
