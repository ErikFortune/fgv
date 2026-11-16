[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / mergeBindings

# Function: mergeBindings()

> **mergeBindings**(`chain`, `scopeBindings`, `slots`, `callerSubstitutions`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IBindingMergeResult`](../interfaces/IBindingMergeResult.md)\>

Merges scope-level binding records across the supplied scope chain and
applies caller substitutions, honoring per-binding `enforced` locks.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `chain` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] | Scope chain, most-specific first. |
| `scopeBindings` | `ReadonlyMap`\<[`ScopeKey`](../type-aliases/ScopeKey.md), [`IScopeSlotBindingsRecord`](../interfaces/IScopeSlotBindingsRecord.md)\> | Map from scope key to its bindings record (a scope not in the map contributes nothing). |
| `slots` | readonly [`IPromptSlot`](../interfaces/IPromptSlot.md)[] | Descriptor slots (provides `defaultBinding` and the authoritative slot list). |
| `callerSubstitutions` | `Readonly`\<`Record`\<`string`, `string` \| [`SlotBinding`](../type-aliases/SlotBinding.md)\>\> \| `undefined` | Caller-supplied substitutions for this resolve. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IBindingMergeResult`](../interfaces/IBindingMergeResult.md)\>

## Remarks

Per design §1 / §10.4: most-specific scope's binding wins UNLESS a more-
general scope's binding declares `enforced: true`, in which case the
enforced binding wins (and caller substitutions for that slot are
recorded as `'enforced-override-ignored'`).

Cross-scope binding merge is INTENTIONAL: bindings from EVERY scope in
the chain are merged, including scopes that are more specific than the
scope whose record was selected by the chain walker. A tenant-scope
`_bindings.yaml` therefore contributes to a resolve whose record lives
at the global scope.

Resource bindings are NOT serialized synchronously — the merge produces
a trace entry with an empty placeholder `value` and surfaces the
binding in `pendingResourceBindings`. The caller (PromptLibrary)
performs the recursive inner resolve and rewrites each entry's `value`
with the inner body before rendering.
