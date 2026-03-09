[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / KeyValueConverters

# Class: KeyValueConverters\<TK, TV\>

Helper class for converting strongly-typed keys, values, or entries
from unknown values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Constructors

### Constructor

> **new KeyValueConverters**\<`TK`, `TV`\>(`params`): `KeyValueConverters`\<`TK`, `TV`\>

Constructs a new key-value validator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IKeyValueConverterConstructorParams`](../interfaces/IKeyValueConverterConstructorParams.md)\<`TK`, `TV`\> | Key and value converters or validators. |

#### Returns

`KeyValueConverters`\<`TK`, `TV`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="key"></a> `key` | `readonly` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TK`, `unknown`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`TK`, `unknown`\> | Required key [validator](../../Validation/interfaces/Validator.md) or [converter](../../Conversion/interfaces/Converter.md). |
| <a id="value"></a> `value` | `readonly` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TV`, `unknown`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`TV`, `unknown`\> | Required value [validator](../../Validation/interfaces/Validator.md) or [converter](../../Conversion/interfaces/Converter.md). |

## Methods

### convertEntries()

> **convertEntries**(`entries`): [`Result`](../../../../type-aliases/Result.md)\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>[]\>

Converts a supplied iterable of unknowns to valid key-value pairs.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | `Iterable`\<`unknown`\> | The iterable of unknowns to be converted. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>[]\>

`Success` with an array of converted key-value pairs if all entries are valid,
or `Failure` with an error message if any entry is invalid.

***

### convertEntry()

> **convertEntry**(`entry`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Converts a supplied unknown to a valid entry of type `[<TK>, <TV>]`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entry` | `unknown` | The unknown to be converted. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<[`KeyValueEntry`](../type-aliases/KeyValueEntry.md)\<`TK`, `TV`\>, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the converted entry and 'success' detail if the entry
is valid, or `Failure` with an error message and 'invalid-key' or 'invalid-value' detail if
the entry is invalid

***

### convertKey()

> **convertKey**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TK`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Converts a supplied unknown to a valid key value of type `<TK>`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `unknown` | The unknown to be converted. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TK`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the converted key value and 'success' detail if the key is valid,
or `Failure` with an error message and 'invalid-key' detail if the key is invalid.

***

### convertValue()

> **convertValue**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Converts a supplied unknown to a valid value of type `<TV>`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `unknown` | The unknown to be converted. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the converted value and 'success' detail if the value is valid,
or `Failure` with an error message and 'invalid-value' detail if the value is invalid.
