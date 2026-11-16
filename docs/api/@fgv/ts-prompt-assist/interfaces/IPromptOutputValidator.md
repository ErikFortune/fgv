[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptOutputValidator

# Interface: IPromptOutputValidator\<TResponse\>

Output validator parameterized by the consumer's response union
(`TResponse extends \{ kind: string \}`). The chain runtime only invokes
`validate` when `value.kind` matches `appliesTo`.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tresponse"></a> `TResponse` *extends* [`IPromptResponseBase`](IPromptResponseBase.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-appliesto"></a> `appliesTo` | `readonly` | [`PromptOutputValidatorAppliesTo`](../type-aliases/PromptOutputValidatorAppliesTo.md)\<`TResponse`\> | Discriminator value(s) this validator applies to. Single string for single-kind validators; readonly array for cross-kind validators. |

## Methods

### validate()

> **validate**(`value`, `context`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Validates the converted output. The chain runner only invokes this when
`value.kind` matches `appliesTo`; defensive code may re-check.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `TResponse` |
| `context` | [`IOutputValidationContext`](IOutputValidationContext.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>
