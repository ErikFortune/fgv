[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptOutputValidatorAppliesTo

# Type Alias: PromptOutputValidatorAppliesTo\<TResponse\>

> **PromptOutputValidatorAppliesTo**\<`TResponse`\> = `TResponse`\[`"kind"`\] \| `ReadonlyArray`\<`TResponse`\[`"kind"`\]\>

Shape of the `appliesTo` field on an [IPromptOutputValidator](../interfaces/IPromptOutputValidator.md) — the
discriminator value(s) the validator narrows by at runtime.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](../interfaces/IPromptResponseBase.md) |

## Remarks

Single-kind validators set `appliesTo` to one of the consumer's
`TResponse['kind']` literals (e.g. `'cited'`); cross-kind validators set
it to a `ReadonlyArray` of literals (e.g. `['cited', 'classifier']`). The
output pipeline normalizes either form to an array at runtime and skips
validators whose set doesn't include `value.kind`.

Extracted as a named type so the "one value or array of values" union has
a single TSDoc-attach point and consumers authoring validators can
reference the field shape directly. Parameterized by
`TResponse extends IPromptResponseBase` so the named alias preserves the
same narrowing the inline union provided.
