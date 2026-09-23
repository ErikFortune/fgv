/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { PageCursor, TaskResult } from '../types';
import { ok, taskFailure } from './failures';

/**
 * The most view cursor handles a broker holds; the oldest is evicted beyond it.
 * @internal
 */
export const maxViewCursors: number = 256;

interface IViewCursor {
  readonly view: number;
  readonly epoch: string;
  readonly inner: PageCursor;
}

/**
 * View-held page cursors.
 *
 * @remarks
 * A view's cursor is a handle bound to the view instance that issued it — so to its principal and
 * scopes — and to the policy epoch it was issued under, wrapping the repository's own cursor
 * (which is bound to the query and generation). The token says nothing about the keys behind it.
 * A handle presented to another view, after the epoch changed, or after eviction is
 * `cursor-stale`; paging restarts from a new query.
 * @internal
 */
export class ViewCursorTable {
  private readonly _handles: Map<string, IViewCursor> = new Map();
  private _next: number = 0;

  public issue(view: number, epoch: string, inner: PageCursor): PageCursor {
    const token: string = `view.${++this._next}`;
    if (this._handles.size >= maxViewCursors) {
      // Map iteration is insertion order: the first key is the oldest handle.
      this._handles.delete(this._handles.keys().next().value!);
    }
    this._handles.set(token, { view, epoch, inner });
    return token as PageCursor;
  }

  public resolve(token: PageCursor, view: number, epoch: string): TaskResult<PageCursor> {
    const handle: IViewCursor | undefined = this._handles.get(token);
    if (handle === undefined || handle.view !== view || handle.epoch !== epoch) {
      return taskFailure(
        `cursor ${token}: not a live cursor of this view under the current policy; restart the query`,
        'cursor-stale',
        'safe'
      );
    }
    return ok(handle.inner);
  }
}
