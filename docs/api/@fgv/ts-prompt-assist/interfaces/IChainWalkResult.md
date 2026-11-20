[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IChainWalkResult

# Interface: IChainWalkResult

Outcome of a chain walk.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-record"></a> `record` | `readonly` | [`IStoredPromptRecord`](IStoredPromptRecord.md) |
| <a id="property-scopebindings"></a> `scopeBindings` | `readonly` | `ReadonlyMap`\<[`ScopeKey`](../type-aliases/ScopeKey.md), [`IScopeSlotBindingsRecord`](IScopeSlotBindingsRecord.md)\> |
| <a id="property-scopesconsulted"></a> `scopesConsulted` | `readonly` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] |
| <a id="property-winningscope"></a> `winningScope` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) |
