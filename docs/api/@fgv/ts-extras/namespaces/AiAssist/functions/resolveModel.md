[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveModel

# Function: resolveModel()

> **resolveModel**(`spec`, `context?`): `string`

Resolves a [AiAssist.ModelSpec](../type-aliases/ModelSpec.md) to a concrete model string given an optional context key.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spec` | [`ModelSpec`](../type-aliases/ModelSpec.md) | The model specification to resolve |
| `context?` | `string` | Optional context key (e.g. `'advanced'`) |

## Returns

`string`

The resolved model string

## Remarks

Resolution rules:
1. If the spec is a string, return it directly (context is irrelevant).
2. If the spec is an object, walk the ordered candidate keys for the context:
   a quality-tier context (`advanced`/`frontier`) cascades through the
   tier-fallback table (`frontier → advanced → base`, `advanced → base`);
   every other context resolves flat (`[context]`); `undefined` resolves to
   the shared `base` fallback. The first present key wins.
3. Otherwise, fall back to the ['base'](../variables/MODEL_SPEC_BASE_KEY.md) key.
4. If neither context nor `'base'` exists, use the first available value; an
   empty spec resolves to `''`.

A spec outside the [AiAssist.ModelSpec](../type-aliases/ModelSpec.md) type — a key holding `undefined`, `null` or a
number, reachable from untyped JSON or a cast — also resolves to `''` rather than throwing. Use
[AiAssist.resolveProviderModel](resolveProviderModel.md) for a `Failure` that names the provider and the offending key.
