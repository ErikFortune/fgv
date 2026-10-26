/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { captureAsyncResult } from '@fgv/ts-utils';
import { TaskResult } from '../types';
import { propagateFailure, taskFailure } from './failures';

/**
 * The most gated sections that may wait for the writer at once. Beyond it a caller is refused
 * (`conflict`, retry `safe`) rather than queued without bound.
 * @internal
 */
export const maxWaitingWriters: number = 64;

/**
 * A bounded FIFO in front of the repository's single writer.
 *
 * @remarks
 * The repository refuses a concurrent `withWriter` outright. Broker operations authorize outside
 * the writer and then need their gated section to run, in order, rather than be refused because
 * another operation holds it — so that a stale write fails on its revision, not on timing.
 * @internal
 */
export class WriterQueue {
  private _tail: Promise<unknown> = Promise.resolve();
  private _waiting: number = 0;
  private readonly _idle: Set<() => void> = new Set();

  /** Whether any section is waiting or running. */
  public get busy(): boolean {
    return this._waiting > 0;
  }

  /**
   * Calls `waiter` once, the next time no section is waiting or running. Returns the function that
   * withdraws it. Never takes a turn in the queue.
   */
  public onIdle(waiter: () => void): () => void {
    this._idle.add(waiter);
    return () => {
      this._idle.delete(waiter);
    };
  }

  /** Runs `section` after every section queued before it has finished. */
  public run<T>(section: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> {
    if (this._waiting >= maxWaitingWriters) {
      return Promise.resolve(
        taskFailure<T>(
          `broker: ${maxWaitingWriters} operations are already waiting for the writer; retry`,
          'conflict',
          'safe'
        )
      );
    }
    this._waiting++;
    const turn: Promise<TaskResult<T>> = this._tail.then(async () => {
      const outcome = await captureAsyncResult(section);
      this._waiting--;
      if (this._waiting === 0) {
        this._notifyIdle();
      }
      return outcome.isSuccess()
        ? outcome.value
        : propagateFailure<T>(`broker: a gated section threw: ${outcome.message}`);
    });
    this._tail = turn;
    return turn;
  }

  private _notifyIdle(): void {
    const waiters: ReadonlyArray<() => void> = [...this._idle];
    this._idle.clear();
    for (const waiter of waiters) {
      waiter();
    }
  }
}
