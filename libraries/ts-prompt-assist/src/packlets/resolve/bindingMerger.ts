/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { IPromptSlot } from '../types';
import { IScopeSlotBindingsRecord } from '../types';
import { ILiteralSlotBinding, IResourceSlotBinding, PromptSubstitutions, SlotBinding } from '../types';
import { ScopeKey, SlotName } from '../types';
import { IBindingTraceEntry, ISafeguardFinding } from '../types';
import { normalizeSubstitutionEntry } from '../converters';

/**
 * A resource-binding entry that survives the synchronous binding merge with
 * an empty placeholder `value` and must be resolved asynchronously by the
 * caller (the recursive resource-binding resolver in `PromptLibrary`).
 * @public
 */
export interface IPendingResourceBinding {
  readonly slot: SlotName;
  readonly binding: IResourceSlotBinding;
}

/**
 * Outcome of binding merge: per slot, the winning entry plus any safeguard
 * findings produced during merge (notably `'enforced-override-ignored'`).
 *
 * @remarks
 * Each resource-binding entry in `merged` carries a placeholder `value: ''`;
 * its corresponding `IPendingResourceBinding` appears in
 * `pendingResourceBindings`. The caller (the recursive resource-binding
 * resolver in `PromptLibrary`) builds a final `Map` from `merged` and
 * overrides each pending entry's `value` with the inner resolve's body
 * before rendering.
 *
 * @public
 */
export interface IBindingMergeResult {
  readonly merged: ReadonlyMap<SlotName, IBindingTraceEntry>;
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
  readonly pendingResourceBindings: ReadonlyArray<IPendingResourceBinding>;
}

/**
 * Merges scope-level binding records across the supplied scope chain and
 * applies caller substitutions, honoring per-binding `enforced` locks.
 *
 * @remarks
 * Per design §1 / §10.4: most-specific scope's binding wins UNLESS a more-
 * general scope's binding declares `enforced: true`, in which case the
 * enforced binding wins (and caller substitutions for that slot are
 * recorded as `'enforced-override-ignored'`).
 *
 * Cross-scope binding merge is INTENTIONAL: bindings from EVERY scope in
 * the chain are merged, including scopes that are more specific than the
 * scope whose record was selected by the chain walker. A tenant-scope
 * `_bindings.yaml` therefore contributes to a resolve whose record lives
 * at the global scope.
 *
 * Resource bindings are NOT serialized synchronously — the merge produces
 * a trace entry with an empty placeholder `value` and surfaces the
 * binding in `pendingResourceBindings`. The caller (PromptLibrary)
 * performs the recursive inner resolve and rewrites each entry's `value`
 * with the inner body before rendering.
 *
 * @param chain - Scope chain, most-specific first.
 * @param scopeBindings - Map from scope key to its bindings record (a scope
 *   not in the map contributes nothing).
 * @param slots - Descriptor slots (provides `defaultBinding` and the
 *   authoritative slot list).
 * @param callerSubstitutions - Caller-supplied substitutions for this resolve.
 *
 * @public
 */
export function mergeBindings(
  chain: ReadonlyArray<ScopeKey>,
  scopeBindings: ReadonlyMap<ScopeKey, IScopeSlotBindingsRecord>,
  slots: ReadonlyArray<IPromptSlot>,
  callerSubstitutions: PromptSubstitutions | undefined
): Result<IBindingMergeResult> {
  const winning = new Map<SlotName, { binding: SlotBinding; scope: ScopeKey }>();
  // Count of DISTINCT scopes in `chain` that declared a binding for each
  // slot, regardless of which one ends up winning. Feeds
  // `IBindingTraceEntry.chainBindingCount`, which the cache-stability
  // diagnostic's D1 check (design.md §9) uses to tell "one scope could bind
  // this slot" apart from "the winning value depends on which scope wins
  // this chain".
  const chainBindingCounts = new Map<SlotName, number>();
  // Scopes already processed in this walk. `chain` is caller-supplied and
  // not guaranteed distinct; processing the same scope twice would
  // double-count its bindings above, producing a false chainBindingCount
  // >= 2 (and a false D1 refutation) for a slot only one scope actually
  // binds. Winner selection is idempotent under a repeat, so skipping the
  // repeat outright is correct for both, not just for counting.
  const processedScopes = new Set<ScopeKey>();

  // Walk chain from most-general (last) to most-specific (first). For each
  // scope, set unset slot bindings, and ALSO overwrite previously-set non-
  // enforced bindings with this scope's enforced bindings (an enforced
  // binding from a more-general scope locks the value).
  for (let i = chain.length - 1; i >= 0; i--) {
    const scope = chain[i];
    if (processedScopes.has(scope)) {
      continue;
    }
    processedScopes.add(scope);
    const record = scopeBindings.get(scope);
    if (record === undefined) {
      continue;
    }
    record.bindings.forEach((binding, slot) => {
      chainBindingCounts.set(slot, (chainBindingCounts.get(slot) ?? 0) + 1);
      const existing = winning.get(slot);
      if (existing === undefined) {
        winning.set(slot, { binding, scope });
        return;
      }
      if (existing.binding.enforced === true) {
        return;
      }
      winning.set(slot, { binding, scope });
    });
  }

  const merged = new Map<SlotName, IBindingTraceEntry>();
  const safeguardFindings: ISafeguardFinding[] = [];
  const pendingResourceBindings: IPendingResourceBinding[] = [];

  for (const slot of slots) {
    const winner = winning.get(slot.name);
    const callerEntry = callerSubstitutions?.[slot.name];
    const slotDefault = slot.defaultBinding;

    if (winner !== undefined && winner.binding.enforced === true && callerEntry !== undefined) {
      safeguardFindings.push({
        slot: slot.name,
        kind: 'enforced-override-ignored',
        disposition: 'info',
        detail: `slot '${slot.name}': caller substitution ignored; binding at scope '${winner.scope}' is enforced`
      });
      const installed = installBinding(
        slot,
        winner.binding,
        'binding',
        winner.scope,
        true,
        merged,
        pendingResourceBindings,
        chainBindingCounts.get(slot.name)
      );
      if (installed.isFailure()) {
        return fail(installed.message);
      }
      continue;
    }

    if (callerEntry !== undefined) {
      const binding = normalizeSubstitutionEntry(callerEntry);
      const installed = installBinding(
        slot,
        binding,
        'caller-sub',
        undefined,
        false,
        merged,
        pendingResourceBindings
      );
      if (installed.isFailure()) {
        return fail(installed.message);
      }
      continue;
    }

    if (winner !== undefined) {
      const installed = installBinding(
        slot,
        winner.binding,
        'binding',
        winner.scope,
        winner.binding.enforced === true,
        merged,
        pendingResourceBindings,
        chainBindingCounts.get(slot.name)
      );
      if (installed.isFailure()) {
        return fail(installed.message);
      }
      continue;
    }

    if (slotDefault !== undefined) {
      const installed = installBinding(
        slot,
        slotDefault,
        'default',
        undefined,
        false,
        merged,
        pendingResourceBindings
      );
      if (installed.isFailure()) {
        return fail(installed.message);
      }
      continue;
    }

    if (slot.required !== false) {
      return fail(`prompt: required slot '${slot.name}' has no binding`);
    }

    // Optional unbound slot: present in merged map as an explicit empty entry.
    merged.set(slot.name, {
      source: 'empty',
      directive: 'prose',
      value: '',
      wasEnforced: false
    });
  }

  return succeed({ merged, safeguardFindings, pendingResourceBindings });
}

function installBinding(
  slot: IPromptSlot,
  binding: SlotBinding,
  source: IBindingTraceEntry['source'],
  winningScope: ScopeKey | undefined,
  wasEnforced: boolean,
  merged: Map<SlotName, IBindingTraceEntry>,
  pending: IPendingResourceBinding[],
  chainBindingCount?: number
): Result<true> {
  if (binding.kind === 'resource') {
    // The placeholder `value: ''` is rewritten by the caller (the
    // recursive resource-binding resolver in PromptLibrary) once the
    // inner resolve completes.
    merged.set(slot.name, {
      source,
      winningScope,
      directive: binding.directive,
      value: '',
      wasEnforced,
      chainBindingCount
    });
    pending.push({ slot: slot.name, binding });
    return succeed(true as const);
  }
  return serializeLiteral(slot, binding).onSuccess((value) => {
    merged.set(slot.name, {
      source,
      winningScope,
      directive: binding.directive,
      value,
      wasEnforced,
      chainBindingCount
    });
    return succeed(true as const);
  });
}

function serializeLiteral(slot: IPromptSlot, binding: ILiteralSlotBinding): Result<string> {
  const kind = slot.kind ?? 'string';
  if (kind !== 'string') {
    // Non-string slot kinds require a registered serializer; resolved at
    // PromptLibrary level so we surface a clear failure here. B-1's
    // foundation supports `kind: 'string'` literally; non-string serializers
    // are wired in a follow-on once we have a real serializer to test
    // against.
    return fail(
      `slot '${slot.name}': literal binding for non-string kind '${kind}' is not supported in v0.1 foundation`
    );
  }
  return succeed(binding.value);
}
