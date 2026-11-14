[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IBindingTraceEntry

# Interface: IBindingTraceEntry

Trace entry per slot in the merged bindings result.

## Remarks

Surfaces *which* binding won — a caller substitution, a scope-level
`_bindings.yaml` entry, the slot's `defaultBinding`, or the empty
fallback — and (for scope-level wins) which scope contributed it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-chainbindingcount"></a> `chainBindingCount?` | `readonly` | `number` | Number of scopes in the resolve's chain that declared a `_bindings.yaml` entry for this slot, counted while merging (regardless of which one won). Set only when `source === 'binding'`. **Remarks** A count of `2` or more means the winning value depends on which scope wins in *this* chain — a different chain could select a different scope's binding and produce different bytes. This is the evidence the cache-stability diagnostic's D1 check (design.md §9) needs to refute an authored or call-site claim of better-than-`'per-request'` stability; it does not by itself mean the value *does* vary, only that it *may*. |
| <a id="property-directive"></a> `directive` | `readonly` | [`SlotDirective`](../type-aliases/SlotDirective.md) | Framing directive carried with the binding (`'constraint' \| 'hint' \| 'prose'`). For `source === 'empty'` (the fallback when no binding, default, or caller substitution applies) this field is `'prose'` — placeholder metadata, not author intent. |
| <a id="property-source"></a> `source` | `readonly` | [`BindingTraceSource`](../type-aliases/BindingTraceSource.md) | Where the winning value came from. |
| <a id="property-value"></a> `value` | `readonly` | `string` | Post-serialization, pre-Mustache string fed into the template renderer. |
| <a id="property-wasenforced"></a> `wasEnforced` | `readonly` | `boolean` | True iff the merged binding had `enforced: true` (caller subs were rejected). |
| <a id="property-winningscope"></a> `winningScope?` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | Set when `source === 'binding'`. The scope whose `_bindings.yaml` won. |
