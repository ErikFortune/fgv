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

interface IViewCursor<TInner> {
  readonly view: number;
  readonly epoch: string;
  readonly inner: TInner;
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
export class ViewCursorTable<TInner = PageCursor> {
  private readonly _handles: Map<string, IViewCursor<TInner>> = new Map();
  private _next: number = 0;
  private readonly _prefix: string;

  /** Tables with distinct prefixes issue disjoint tokens, so one table's token never resolves in another. */
  public constructor(prefix: string = 'view') {
    this._prefix = prefix;
  }

  public issue(view: number, epoch: string, inner: TInner): PageCursor {
    const token: string = `${this._prefix}.${++this._next}`;
    if (this._handles.size >= maxViewCursors) {
      // Map iteration is insertion order: the first key is the oldest handle.
      this._handles.delete(this._handles.keys().next().value!);
    }
    this._handles.set(token, { view, epoch, inner });
    return token as PageCursor;
  }

  public resolve(token: PageCursor, view: number, epoch: string): TaskResult<TInner> {
    const handle: IViewCursor<TInner> | undefined = this._handles.get(token);
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
