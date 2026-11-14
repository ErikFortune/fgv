[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IBindingMergeResult

# Interface: IBindingMergeResult

Outcome of binding merge: per slot, the winning entry plus any safeguard
findings produced during merge (notably `'enforced-override-ignored'`).

## Remarks

Each resource-binding entry in `merged` carries a placeholder `value: ''`;
its corresponding `IPendingResourceBinding` appears in
`pendingResourceBindings`. The caller (the recursive resource-binding
resolver in `PromptLibrary`) builds a final `Map` from `merged` and
overrides each pending entry's `value` with the inner resolve's body
before rendering.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-merged"></a> `merged` | `readonly` | `ReadonlyMap`\<[`SlotName`](../type-aliases/SlotName.md), [`IBindingTraceEntry`](IBindingTraceEntry.md)\> |
| <a id="property-pendingresourcebindings"></a> `pendingResourceBindings` | `readonly` | readonly [`IPendingResourceBinding`](IPendingResourceBinding.md)[] |
| <a id="property-safeguardfindings"></a> `safeguardFindings` | `readonly` | readonly [`ISafeguardFinding`](ISafeguardFinding.md)[] |
