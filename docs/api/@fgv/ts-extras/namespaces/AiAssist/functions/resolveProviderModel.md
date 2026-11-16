[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveProviderModel

# Function: resolveProviderModel()

> **resolveProviderModel**(`descriptor`, `modelOverride`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

The full provider model-resolution chokepoint: the [ModelSpecKey](../type-aliases/ModelSpecKey.md) walk
(via [resolveModel](resolveModel.md)) THEN [resolveModelAlias](resolveModelAlias.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor (supplies `defaultModel` and `aliases`). |
| `modelOverride` | [`ModelSpec`](../type-aliases/ModelSpec.md) \| `undefined` | An optional caller-supplied `ModelSpec` that takes precedence over `descriptor.defaultModel`. May itself contain or be an alias. |
| `context?` | [`ModelSpecKey`](../type-aliases/ModelSpecKey.md) | Optional [ModelSpecKey](../type-aliases/ModelSpecKey.md) selecting the spec branch. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Result` with the concrete provider model id, or a failure. A spec outside the
[AiAssist.ModelSpec](../type-aliases/ModelSpec.md) type fails with the provider id and the dotted path of the offending key
(`provider "openai": model spec modelOverride.base is undefined: …`).

## Remarks

Replaces the bare `resolveModel(modelOverride ?? descriptor.defaultModel, context)`
call plus the duplicated empty-result check at each call-time chokepoint. The
`ModelSpec` branch is selected first; the resulting string — which may itself
be an fgv alias — is then resolved to a concrete id.

**This is the whole model-selection surface — do not hand-roll the walk.**
Callers should pass the `ModelSpecKey` they want and use the concrete id
this returns; a manual `resolveModel` + `resolveModelAlias` sequence is
both redundant and easy to get wrong (it is how alias-form ids leak into
capability lookups such as `resolveImageCapability`).

**`context` carries the quality tier and the modality — never tools or
thinking.** `ModelSpecKey` has no `tools` / `thinking` key: server-side
tools and reasoning effort are orthogonal request params that ride on top of
whatever model the tier selected, and never select a model. A tool-path caller
passes a tier like any other caller — omit `context` for `base`, or pass
`'advanced'` / `'frontier'` — and sets the tools / thinking request params
separately.
