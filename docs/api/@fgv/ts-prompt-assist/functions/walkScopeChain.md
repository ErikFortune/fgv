[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / walkScopeChain

# Function: walkScopeChain()

> **walkScopeChain**(`store`, `id`, `chain`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IChainWalkResult`](../interfaces/IChainWalkResult.md)\>\>

Walks the supplied scope chain (most-specific first) to find the first
scope with a record for `id`. Also collects scope-level binding records
for every scope in the chain so the binding merger can run cross-scope.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `store` | [`IPromptStore`](../interfaces/IPromptStore.md) |
| `id` | [`PromptId`](../type-aliases/PromptId.md) |
| `chain` | readonly [`ScopeKey`](../type-aliases/ScopeKey.md)[] |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IChainWalkResult`](../interfaces/IChainWalkResult.md)\>\>
