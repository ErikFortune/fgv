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

import { Result } from '@fgv/ts-utils';
import type {
  IDisposable,
  IPromptStoreEvent,
  IQualifierDecl,
  IScopeSlotBindingsRecord,
  IStoredPromptRecord,
  PromptId,
  ScopeKey
} from '../types';

/**
 * Filter for listing stored prompt records.
 * @public
 */
export interface IPromptStoreListFilter {
  /** Filter by prompt id. */
  readonly id?: PromptId;
  /** Filter by scope. */
  readonly scope?: ScopeKey;
}

/**
 * Storage adapter interface for the prompt library.
 * @public
 */
export interface IPromptStore {
  /**
   * Gets a stored prompt record by scope and id.
   * Returns `undefined` (not failure) when no record exists at that scope.
   */
  get(scope: ScopeKey, id: PromptId): Promise<Result<IStoredPromptRecord | undefined>>;

  /**
   * Lists all stored prompt records, optionally filtered.
   */
  list(filter?: IPromptStoreListFilter): Promise<Result<ReadonlyArray<IStoredPromptRecord>>>;

  /**
   * Gets the scope-level slot bindings record for a scope.
   * Returns `undefined` when no bindings file exists for that scope.
   */
  getBindings(scope: ScopeKey): Promise<Result<IScopeSlotBindingsRecord | undefined>>;

  /**
   * Gets the qualifier configuration published by this store.
   * Returns `undefined` when the store carries no qualifier configuration.
   */
  getQualifierConfig(): Promise<Result<ReadonlyArray<IQualifierDecl> | undefined>>;

  // Optional write surface (not implemented in v0.1)
  /** Stores a prompt record. */
  put?(record: IStoredPromptRecord): Promise<Result<IStoredPromptRecord>>;
  /** Stores a scope-level bindings record. */
  putBindings?(record: IScopeSlotBindingsRecord): Promise<Result<IScopeSlotBindingsRecord>>;
  /** Deletes a prompt record by scope and id. */
  delete?(scope: ScopeKey, id: PromptId): Promise<Result<PromptId>>;

  // Optional hot-reload (not implemented in v0.1)
  /** Subscribes to store change events. Returns a disposable handle to cancel the subscription. */
  watch?(handler: (event: IPromptStoreEvent) => void): IDisposable;
}
