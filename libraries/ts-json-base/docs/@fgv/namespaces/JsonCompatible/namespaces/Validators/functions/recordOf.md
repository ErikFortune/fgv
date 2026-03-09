[**@fgv/ts-json-base**](../../../../../../README.md)

***

[@fgv/ts-json-base](../../../../../../README.md) / [JsonCompatible](../../../README.md) / [Validators](../README.md) / recordOf

# Function: recordOf()

> **recordOf**\<`T`, `TC`, `TK`\>(`validateElement`, `options?`): [`RecordValidator`](../../../type-aliases/RecordValidator.md)\<`T`, `TC`, `TK`\>

A helper function to create a [JSON-compatible RecordValidator\<T, TC, TK\>](../../../type-aliases/RecordValidator.md) which validates a supplied `unknown` value
to a valid [JsonCompatible](../../../../../../type-aliases/JsonCompatibleType.md) value.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |
| `TK` *extends* `string` | `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `validateElement` | [`Validator`](../../../type-aliases/Validator.md)\<`T`, `TC`\> | The element validator to use. |
| `options?` | [`IRecordOfValidatorOptions`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TC`\> | The options to use for the validation. |

## Returns

[`RecordValidator`](../../../type-aliases/RecordValidator.md)\<`T`, `TC`, `TK`\>

A `Validation.Validator<Record<TK, JsonCompatibleType<T>>, TC>` which validates a supplied `unknown` value to a valid [JsonCompatible](../../../../../../type-aliases/JsonCompatibleType.md) value.
