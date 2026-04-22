[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [Hash](../README.md) / Md5Normalizer

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

### \_compareKeys()

> `protected` **\_compareKeys**(`k1`, `k2`): `number`

**`Internal`**

Compares two property names from some object being normalized.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `k1` | `unknown` | First key to be compared. |
| `k2` | `unknown` | Second key to be compared. |

#### Returns

`number`

`1` if `k1` is greater, `-1` if `k2` is greater and
`0` if they are equal.

#### Inherited from

`Hash.HashingNormalizer._compareKeys`

***

### \_normalizeArray()

> `protected` **\_normalizeArray**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown`[] |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`[]\>

#### Inherited from

`Hash.HashingNormalizer._normalizeArray`

***

### \_normalizeLiteralToString()

> `protected` **\_normalizeLiteralToString**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

**`Internal`**

Constructs a normalized string representation of some literal value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `string` \| `number` \| `bigint` \| `boolean` \| `symbol` \| `RegExp` \| `Date` \| `null` \| `undefined` | The literal value to be normalized. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

A normalized string representation of the literal.

#### Inherited from

`Hash.HashingNormalizer._normalizeLiteralToString`

***

### computeHash()

> **computeHash**(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Inherited from

`Hash.HashingNormalizer.computeHash`

***

### normalize()

> **normalize**\<`T`\>(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

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

> **normalizeLiteral**\<`T`\>(`from`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

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
