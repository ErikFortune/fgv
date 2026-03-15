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
 * Chocolate Lab convenience wrapper for semantic cascade operations.
 *
 * Wires the generic {@link useCascadeOps} from ts-app-shell to the
 * Chocolate Lab navigation store, preserving the zero-argument call
 * signature for tab consumers.
 *
 * @packageDocumentation
 */

import { type ICascadeOps, useCascadeOps as useCascadeOpsBase } from '@fgv/ts-app-shell';

import { useNavigationStore } from './store';
import type { ICascadeEntry } from './model';

/**
 * Hook providing semantic cascade operations, wired to the Chocolate Lab
 * navigation store.
 *
 * This is a convenience wrapper around the generic `useCascadeOps` from
 * ts-app-shell. It reads `cascadeStack` and `squashCascade` from
 * {@link useNavigationStore} so that tab consumers can call `useCascadeOps()`
 * with no arguments.
 *
 * The generic type parameter is inferred as `ICascadeEntry` from the store's
 * `cascadeStack` type, so all returned operations preserve the full
 * chocolate-specific entry type.
 *
 * @public
 */
export function useCascadeOps(): ICascadeOps<ICascadeEntry> {
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  return useCascadeOpsBase(cascadeStack, squashCascade);
}
