/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
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

  // Bindings lookups across scopes are independent, so fire them in
  // parallel. For the in-process FileTree adapter this is a no-op; for
  // future out-of-process adapters (SQL / Mongo) it converts a chain-
  // length-many sequential round-trips into one round-trip-wide.
  const bindingsResults = await Promise.all(
    chain.map((scope) =>
      store
        .getBindings(scope)
        .then((r) =>
          r.withErrorFormat((msg) => `prompt '${id}' scope '${scope}': store.getBindings failed: ${msg}`)
        )
    )
  );
  const scopeBindings = new Map<ScopeKey, IScopeSlotBindingsRecord>();
  const aggregated = mapResults(bindingsResults);
  if (aggregated.isFailure()) {
    return fail(aggregated.message);
  }
  aggregated.value.forEach((record, i) => {
    if (record !== undefined) {
      scopeBindings.set(chain[i], record);
    }
  });

  return succeed({
    record: winning.record,
    winningScope: winning.scope,
    scopesConsulted,
    scopeBindings
  });
}
