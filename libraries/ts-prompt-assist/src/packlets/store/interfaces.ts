/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { Qualifiers } from '@fgv/ts-res';
import { PromptId, ScopeKey } from '../types';
import { IScopeSlotBindingsRecord, IStoredPromptRecord } from '../types';
import { IDisposable, IPromptStoreEvent } from '../types';

/**
 * Filter for {@link IPromptStore.list}.
 * @public
 */
export interface IPromptStoreListFilter {
  /** Restrict to records carrying this prompt id (across all scopes). */
  readonly id?: PromptId;
  /** Restrict to records in this scope. */
  readonly scope?: ScopeKey;
}

/**
 * Storage adapter contract. v0.1 ships a read-only `FileTreePromptStore`;
 * SQL / Mongo adapters drop in later.
 *
 * Optional write surface (`put` / `putBindings` / `delete`) and the change-
 * notification surface (`watch`) are left undefined on the v0.1 FileTree
 * adapter per OQ-3.
 *
 * @public
 */
export interface IPromptStore {
  /** Returns the record at `(scope, id)` or `undefined` if none exists. */
  get(scope: ScopeKey, id: PromptId): Promise<Result<IStoredPromptRecord | undefined>>;
  /** Returns all records, optionally filtered. */
  list(filter?: IPromptStoreListFilter): Promise<Result<ReadonlyArray<IStoredPromptRecord>>>;
  /** Returns the scope-level `_bindings.yaml` record (or `undefined` if absent). */
  getBindings(scope: ScopeKey): Promise<Result<IScopeSlotBindingsRecord | undefined>>;
  /**
   * Returns the ts-res qualifier declarations carried by the store, or
   * `undefined` if the store does not publish qualifier config (consumer
   * supplies it directly to `PromptLibrary.create`).
   */
  getQualifierConfig(): Promise<Result<ReadonlyArray<Qualifiers.IQualifierDecl> | undefined>>;

  /** Optional write surface. v0.1 `FileTreePromptStore` leaves this undefined. */
  put?(record: IStoredPromptRecord): Promise<Result<IStoredPromptRecord>>;
  /** Optional bindings-write surface. v0.1 `FileTreePromptStore` leaves this undefined. */
  putBindings?(record: IScopeSlotBindingsRecord): Promise<Result<IScopeSlotBindingsRecord>>;
  /** Optional delete surface. v0.1 `FileTreePromptStore` leaves this undefined. */
  delete?(scope: ScopeKey, id: PromptId): Promise<Result<PromptId>>;

  /** Optional change-notification surface (per OQ-3). No v0.1 adapter implements this. */
  watch?(handler: (event: IPromptStoreEvent) => void): IDisposable;
}
