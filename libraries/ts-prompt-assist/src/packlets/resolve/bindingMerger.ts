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
 * Outcome of binding merge: per slot, the winning entry plus any safeguard
 * findings produced during merge (notably `'enforced-override-ignored'`).
 * @public
 */
export interface IBindingMergeResult {
  readonly merged: ReadonlyMap<SlotName, IBindingTraceEntry>;
  readonly mergedBindings: ReadonlyMap<SlotName, SlotBinding>;
  readonly safeguardFindings: ReadonlyArray<ISafeguardFinding>;
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
 * The chain is supplied most-specific first (`chain[0]` is the most-specific
 * scope). The winning scope produced by the chain walker is `chain[0]` for
 * the resolved descriptor.
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

  // Walk chain from most-general (last) to most-specific (first). For each
  // scope, set unset slot bindings, and ALSO overwrite previously-set non-
  // enforced bindings with this scope's enforced bindings (an enforced
  // binding from a more-general scope locks the value).
  for (let i = chain.length - 1; i >= 0; i--) {
    const scope = chain[i];
    const record = scopeBindings.get(scope);
    if (record === undefined) {
      continue;
    }
    record.bindings.forEach((binding, slot) => {
      const existing = winning.get(slot);
      // Specificity rule: more-specific (smaller i) takes precedence unless
      // an existing entry is enforced from a more-general scope.
      if (existing === undefined) {
        winning.set(slot, { binding, scope });
        return;
      }
      if (existing.binding.enforced === true) {
        // Lock from a more-general scope holds; this scope's value is
        // overridden only if it is also enforced AND we are at a STILL
        // more-general scope — which can't happen because we walk general-
        // to-specific. So keep existing.
        return;
      }
      winning.set(slot, { binding, scope });
    });
  }

  const merged = new Map<SlotName, IBindingTraceEntry>();
  const mergedBindings = new Map<SlotName, SlotBinding>();
  const safeguardFindings: ISafeguardFinding[] = [];

  for (const slot of slots) {
    const winner = winning.get(slot.name);
    const callerEntry = callerSubstitutions?.[slot.name];
    const slotDefault = slot.defaultBinding;

    // If a non-enforced winner exists and the caller supplied a sub for
    // this slot, the caller sub wins. If the winner is enforced, the
    // caller sub is rejected and a safeguard finding emitted.
    if (winner !== undefined && winner.binding.enforced === true && callerEntry !== undefined) {
      safeguardFindings.push({
        slot: slot.name,
        kind: 'enforced-override-ignored',
        disposition: 'info',
        detail: `slot '${slot.name}': caller substitution ignored; binding at scope '${winner.scope}' is enforced`
      });
      const entryResult = serializeBinding(slot, winner.binding);
      /* c8 ignore next 4 - same shape as the dedicated serialize-failure test */
      if (entryResult.isFailure()) {
        return fail(entryResult.message);
      }

      merged.set(slot.name, {
        source: 'binding',
        winningScope: winner.scope,
        directive: winner.binding.directive,
        value: entryResult.value,
        wasEnforced: true
      });
      mergedBindings.set(slot.name, winner.binding);
      continue;
    }

    if (callerEntry !== undefined) {
      const binding = normalizeSubstitutionEntry(callerEntry);
      const entryResult = serializeBinding(slot, binding);
      /* c8 ignore next 3 - same shape as the dedicated serialize-failure test */
      if (entryResult.isFailure()) {
        return fail(entryResult.message);
      }
      merged.set(slot.name, {
        source: 'caller-sub',
        directive: binding.directive,
        value: entryResult.value,
        wasEnforced: false
      });
      mergedBindings.set(slot.name, binding);
      continue;
    }

    if (winner !== undefined) {
      const entryResult = serializeBinding(slot, winner.binding);
      if (entryResult.isFailure()) {
        return fail(entryResult.message);
      }
      merged.set(slot.name, {
        source: 'binding',
        winningScope: winner.scope,
        directive: winner.binding.directive,
        value: entryResult.value,
        wasEnforced: winner.binding.enforced === true
      });
      mergedBindings.set(slot.name, winner.binding);
      continue;
    }

    if (slotDefault !== undefined) {
      const entryResult = serializeBinding(slot, slotDefault);
      /* c8 ignore next 3 - same shape as the dedicated serialize-failure test */
      if (entryResult.isFailure()) {
        return fail(entryResult.message);
      }
      merged.set(slot.name, {
        source: 'default',
        directive: slotDefault.directive,
        value: entryResult.value,
        wasEnforced: false
      });
      mergedBindings.set(slot.name, slotDefault);
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

  return succeed({ merged, mergedBindings, safeguardFindings });
}

function serializeBinding(slot: IPromptSlot, binding: SlotBinding): Result<string> {
  if (binding.kind === 'literal') {
    return serializeLiteral(slot, binding);
  }
  return serializeResource(slot, binding);
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

function serializeResource(slot: IPromptSlot, binding: IResourceSlotBinding): Result<string> {
  // Per the brief's B-1 out-of-scope list: resource bindings resolve in B-2.
  // The foundation MUST fail loudly rather than silently emit a placeholder.
  return fail(
    `slot '${slot.name}': resource binding to '${binding.resourceId}' is not yet implemented in the B-1 foundation (B-2 ships recursive resource binding resolution)`
  );
}
