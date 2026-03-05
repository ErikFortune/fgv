[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / resolveModel

# Function: resolveModel()

> **resolveModel**(`spec`, `context?`): `string`

Resolves a [ModelSpec](../type-aliases/ModelSpec.md) to a concrete model string given an optional context key.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | [`ModelSpec`](../type-aliases/ModelSpec.md) | The model specification to resolve |
| `context?` | `string` | Optional context key (e.g. `'tools'`) |

## Returns

`string`

The resolved model string

## Remarks

Resolution rules:
1. If the spec is a string, return it directly (context is irrelevant).
2. If the spec is an object and the context key exists, recurse into that branch.
3. Otherwise, fall back to the ['base'](../variables/MODEL_SPEC_BASE_KEY.md) key.
4. If neither context nor `'base'` exists, use the first available value.
