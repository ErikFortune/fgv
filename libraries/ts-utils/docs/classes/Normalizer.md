[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / Normalizer

# Class: Normalizer

Normalizes an arbitrary JSON object

## Extended by

- [`HashingNormalizer`](../@fgv/namespaces/Hash/classes/HashingNormalizer.md)

## Constructors

### Constructor

> **new Normalizer**(): `Normalizer`

#### Returns

`Normalizer`

## Methods

### \_normalizeArray()

> `protected` **\_normalizeArray**(`from`): [`Result`](../type-aliases/Result.md)\<`unknown`[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown`[] |

#### Returns

[`Result`](../type-aliases/Result.md)\<`unknown`[]\>

***

### normalize()

> **normalize**\<`T`\>(`from`): [`Result`](../type-aliases/Result.md)\<`T`\>

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

[`Result`](../type-aliases/Result.md)\<`T`\>

A normalized version of the value

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

***

### normalizeLiteral()

> **normalizeLiteral**\<`T`\>(`from`): [`Result`](../type-aliases/Result.md)\<`T`\>

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

[`Result`](../type-aliases/Result.md)\<`T`\>

A normalized value for the literal.
