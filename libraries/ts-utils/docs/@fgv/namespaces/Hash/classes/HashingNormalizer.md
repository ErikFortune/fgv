[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Hash](../README.md) / HashingNormalizer

# Class: HashingNormalizer

Normalizes an arbitrary JSON object

## Extends

- [`Normalizer`](../../../../classes/Normalizer.md)

## Extended by

- [`Crc32Normalizer`](Crc32Normalizer.md)

## Constructors

### Constructor

> **new HashingNormalizer**(`hash`): `HashingNormalizer`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `hash` | [`HashFunction`](../type-aliases/HashFunction.md) |

#### Returns

`HashingNormalizer`

#### Overrides

[`Normalizer`](../../../../classes/Normalizer.md).[`constructor`](../../../../classes/Normalizer.md#constructor)

## Methods

### \_normalizeArray()

> `protected` **\_normalizeArray**(`from`): [`Result`](../../../../type-aliases/Result.md)\<`unknown`[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown`[] |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`unknown`[]\>

#### Inherited from

[`Normalizer`](../../../../classes/Normalizer.md).[`_normalizeArray`](../../../../classes/Normalizer.md#_normalizearray)

***

### computeHash()

> **computeHash**(`from`): [`Result`](../../../../type-aliases/Result.md)\<`string`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`string`\>

***

### normalize()

> **normalize**\<`T`\>(`from`): [`Result`](../../../../type-aliases/Result.md)\<`T`\>

Normalizes the supplied value

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `T` | The value to be normalized |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T`\>

A normalized version of the value

#### Inherited from

[`Normalizer`](../../../../classes/Normalizer.md).[`normalize`](../../../../classes/Normalizer.md#normalize)

***

### normalizeEntries()

> **normalizeEntries**\<`T`\>(`entries`): [`Entry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>[]

Normalizes an array of object property entries (e.g. as returned by `Object.entries()`).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | `Iterable`\<[`Entry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>\> | The entries to be normalized. |

#### Returns

[`Entry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>[]

A normalized sorted array of entries.

#### Remarks

Converts property names (entry key) to string and then sorts as string.

#### Inherited from

[`Normalizer`](../../../../classes/Normalizer.md).[`normalizeEntries`](../../../../classes/Normalizer.md#normalizeentries)

***

### normalizeLiteral()

> **normalizeLiteral**\<`T`\>(`from`): [`Result`](../../../../type-aliases/Result.md)\<`T`\>

Normalizes the supplied literal value

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `T` | The literal value to be normalized. |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`T`\>

A normalized value for the literal.

#### Inherited from

[`Normalizer`](../../../../classes/Normalizer.md).[`normalizeLiteral`](../../../../classes/Normalizer.md#normalizeliteral)
