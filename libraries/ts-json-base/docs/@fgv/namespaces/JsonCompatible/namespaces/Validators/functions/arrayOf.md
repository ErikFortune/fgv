[**@fgv/ts-json-base**](../../../../../../README.md)

***

[@fgv/ts-json-base](../../../../../../README.md) / [JsonCompatible](../../../README.md) / [Validators](../README.md) / arrayOf

# Function: arrayOf()

> **arrayOf**\<`T`, `TC`\>(`validateElement`, `params?`): [`ArrayValidator`](../../../type-aliases/ArrayValidator.md)\<`T`, `TC`\>

A helper function to create a [JSON-compatible ArrayValidator\<T, TC\>](../../../type-aliases/ArrayValidator.md) which validates a supplied `unknown` value to a valid [JsonCompatible](../../../../../../type-aliases/JsonCompatibleType.md) value.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `validateElement` | [`Validator`](../../../type-aliases/Validator.md)\<`T`, `TC`\> | The element validator to use. |
| `params?` | `Omit`\<[`ArrayValidatorConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonCompatibleType`](../../../../../../type-aliases/JsonCompatibleType.md)\<`T`\>, `TC`\>, `"validateElement"`\> | The parameters to use for the validation. |

## Returns

[`ArrayValidator`](../../../type-aliases/ArrayValidator.md)\<`T`, `TC`\>

A [JSON-compatible ArrayValidator\<T, TC\>](../../../type-aliases/ArrayValidator.md) which validates a supplied `unknown` value to a valid [JsonCompatible](../../../../../../type-aliases/JsonCompatibleType.md) value.
