[**@fgv/ts-json-base**](../../../../../../README.md)

***

[@fgv/ts-json-base](../../../../../../README.md) / [JsonCompatible](../../../README.md) / [Validators](../README.md) / object

# Function: object()

> **object**\<`T`, `TC`\>(`properties`, `params?`): [`ObjectValidator`](../../../type-aliases/ObjectValidator.md)\<`T`, `TC`\>

A helper function to create a [JSON-compatible ObjectValidator\<T, TC\>](../../../type-aliases/ObjectValidator.md) which validates a supplied `unknown` value to a valid [JsonCompatible](../../../../../../type-aliases/JsonCompatibleType.md) value.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `properties` | [`Validation.Classes.FieldValidators`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonCompatibleType`](../../../../../../type-aliases/JsonCompatibleType.md)\<`T`\>, `TC`\> | The properties to validate. |
| `params?` | `Omit`\<[`ObjectValidatorConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonCompatibleType`](../../../../../../type-aliases/JsonCompatibleType.md)\<`T`\>, `TC`\>, `"fields"`\> | The parameters to use for the validation. |

## Returns

[`ObjectValidator`](../../../type-aliases/ObjectValidator.md)\<`T`, `TC`\>

A [JSON-compatible ObjectValidator\<T, TC\>](../../../type-aliases/ObjectValidator.md) which validates a supplied `unknown` value to a valid [JsonCompatible](../../../../../../type-aliases/JsonCompatibleType.md) value.
