[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveMaxOutputTokens

# Function: resolveMaxOutputTokens()

> **resolveMaxOutputTokens**(`descriptor`, `modelOverride?`, `context?`): `number` \| `undefined`

The largest `maxTokens` the provider accepts for a completion on the model a call would use, or
`undefined` when that limit is unknown.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor. |
| `modelOverride?` | [`ModelSpec`](../type-aliases/ModelSpec.md) | The model spec the call will pass: a concrete id, an `@provider:role` alias, a context-keyed map, or `undefined` for the descriptor's default. |
| `context?` | [`ModelSpecKey`](../type-aliases/ModelSpecKey.md) | The model-spec key the call will pass (a tier such as `'advanced'`). |

## Returns

`number` \| `undefined`

The model's maximum output tokens, or `undefined` when unknown.

## Remarks

Takes the same model arguments as [resolveProviderModel](resolveProviderModel.md), and resolves through it: the
`ModelSpec` walk for `context` (falling back to `descriptor.defaultModel` when `modelOverride` is
absent), then alias resolution. So pass exactly what you pass to the completion call, and the
answer is the limit of the model that call will reach.

The resolved id is matched against [IAiProviderDescriptor.maxOutputTokens](../interfaces/IAiProviderDescriptor.md#property-maxoutputtokens) by exact
equality — never by prefix, and a dated snapshot gets a limit only from an entry of its own.
Returns `undefined` when no model resolves (an unregistered alias, an empty default), when the
provider declares no limits, and when no entry names the model.

For a proxied call (`callProxiedCompletion` or the streaming proxy) with no tier and no override,
the proxy's own descriptor chooses the model, so pass the explicit spec or tier you want the
answer for. A model chosen outside the `ModelSpecKey` axis — say, a consumer's own
`resolveModel(spec, 'tools')` — is passed here as the resolved string.

Nothing in ai-assist applies this limit to a caller's explicit `maxTokens`. Lowering an explicit
value would turn a loud refusal into a silent truncation, so the clamp is the caller's decision:

```ts
const limit = resolveMaxOutputTokens(descriptor, modelOverride, 'advanced');
const maxTokens = Math.min(myCap, limit ?? myCap);
```
