[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Hash](../README.md) / Crc32Normalizer

# Class: Crc32Normalizer

A [hashing normalizer](HashingNormalizer.md) which computes object
hash using the CRC32 algorithm.

## Extends

- [`HashingNormalizer`](HashingNormalizer.md)

## Constructors

### Constructor

> **new Crc32Normalizer**(): `Crc32Normalizer`

#### Returns

`Crc32Normalizer`

#### Overrides

[`HashingNormalizer`](HashingNormalizer.md).[`constructor`](HashingNormalizer.md#constructor)

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

[`HashingNormalizer`](HashingNormalizer.md).[`_normalizeArray`](HashingNormalizer.md#_normalizearray)

***

### computeHash()

> **computeHash**(`from`): [`Result`](../../../../type-aliases/Result.md)\<`string`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`string`\>

#### Inherited from

[`HashingNormalizer`](HashingNormalizer.md).[`computeHash`](HashingNormalizer.md#computehash)

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

[`HashingNormalizer`](HashingNormalizer.md).[`normalize`](HashingNormalizer.md#normalize)

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

[`HashingNormalizer`](HashingNormalizer.md).[`normalizeEntries`](HashingNormalizer.md#normalizeentries)

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

[`HashingNormalizer`](HashingNormalizer.md).[`normalizeLiteral`](HashingNormalizer.md#normalizeliteral)

***

### crc32Hash()

> `static` **crc32Hash**(`parts`): `string`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `parts` | `string`[] |

#### Returns

`string`
