/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { PromptId, ScopeKey } from '../types';
import { IScopeSlotBindingsRecord, IStoredPromptRecord } from '../types';
import { IPromptStore } from '../store';

/**
 * Outcome of a chain walk.
 * @public
 */
export interface IChainWalkResult {
  readonly record: IStoredPromptRecord;
  readonly winningScope: ScopeKey;
  readonly scopesConsulted: ReadonlyArray<ScopeKey>;
  readonly scopeBindings: ReadonlyMap<ScopeKey, IScopeSlotBindingsRecord>;
}

/**
 * Walks the supplied scope chain (most-specific first) to find the first
 * scope with a record for `id`. Also collects scope-level binding records
 * for every scope in the chain so the binding merger can run cross-scope.
 *
 * @public
 */
export async function walkScopeChain(
  store: IPromptStore,
  id: PromptId,
  chain: ReadonlyArray<ScopeKey>
): Promise<Result<IChainWalkResult>> {
  if (chain.length === 0) {
    return fail(`prompt '${id}': scope chain is empty`);
  }

  const scopesConsulted: ScopeKey[] = [];
  let winning: { record: IStoredPromptRecord; scope: ScopeKey } | undefined;

  for (const scope of chain) {
    if (winning === undefined) {
      scopesConsulted.push(scope);
      const lookup = (await store.get(scope, id)).withErrorFormat(
        (msg) => `prompt '${id}' scope '${scope}': store.get failed: ${msg}`
      );
      if (lookup.isFailure()) {
        return fail(lookup.message);
      }
      if (lookup.value !== undefined) {
        winning = { record: lookup.value, scope };
      }
    }
  }

  if (winning === undefined) {
    return fail(`prompt '${id}': no record found in scope chain [${chain.join(', ')}]`);
  }

  const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>();
  for (const scope of chain) {
    const result = (await store.getBindings(scope)).withErrorFormat(
      (msg) => `prompt '${id}' scope '${scope}': store.getBindings failed: ${msg}`
    );
    if (result.isFailure()) {
      return fail(result.message);
    }
    if (result.value !== undefined) {
      scopeBindings.set(scope, result.value);
    }
  }

  return succeed({
    record: winning.record,
    winningScope: winning.scope,
    scopesConsulted,
    scopeBindings
  });
}
