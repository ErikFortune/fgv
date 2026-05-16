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
  readonly id?: PromptId;
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
  get(scope: ScopeKey, id: PromptId): Promise<Result<IStoredPromptRecord | undefined>>;
  list(filter?: IPromptStoreListFilter): Promise<Result<ReadonlyArray<IStoredPromptRecord>>>;
  getBindings(scope: ScopeKey): Promise<Result<IScopeSlotBindingsRecord | undefined>>;
  /**
   * Returns the ts-res qualifier declarations carried by the store, or
   * `undefined` if the store does not publish qualifier config (consumer
   * supplies it directly to `PromptLibrary.create`).
   */
  getQualifierConfig(): Promise<Result<ReadonlyArray<Qualifiers.IQualifierDecl> | undefined>>;

  put?(record: IStoredPromptRecord): Promise<Result<IStoredPromptRecord>>;
  putBindings?(record: IScopeSlotBindingsRecord): Promise<Result<IScopeSlotBindingsRecord>>;
  delete?(scope: ScopeKey, id: PromptId): Promise<Result<PromptId>>;

  watch?(handler: (event: IPromptStoreEvent) => void): IDisposable;
}
