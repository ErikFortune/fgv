[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [Hash](../README.md) / Md5Normalizer

# Class: Md5Normalizer

A hashing normalizer which computes object
hash using the MD5 algorithm.

## Extends

- [`HashingNormalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

## Constructors

### Constructor

> **new Md5Normalizer**(): `Md5Normalizer`

#### Returns

`Md5Normalizer`

#### Overrides

`Hash.HashingNormalizer.constructor`

## Methods

### \_normalizeArray()

> `protected` **\_normalizeArray**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown`[] |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`[]\>

#### Inherited from

`Hash.HashingNormalizer._normalizeArray`

***

### computeHash()

> **computeHash**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

#### Inherited from

`Hash.HashingNormalizer.computeHash`

***

### normalize()

> **normalize**\<`T`\>(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

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

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

A normalized version of the value

#### Inherited from

`Hash.HashingNormalizer.normalize`

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

`Hash.HashingNormalizer.normalizeEntries`

***

### normalizeLiteral()

> **normalizeLiteral**\<`T`\>(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

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

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

A normalized value for the literal.

#### Inherited from

`Hash.HashingNormalizer.normalizeLiteral`

***

### md5Hash()

> `static` **md5Hash**(`parts`): `string`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `parts` | `string`[] |

#### Returns

`string`
