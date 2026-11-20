[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-utils](../README.md) / Normalizer

# Class: Normalizer

Normalizes an arbitrary JSON object

## Extended by

- [`HashingNormalizer`](../namespaces/Hash/classes/HashingNormalizer.md)

## Constructors

### Constructor

> **new Normalizer**(): `Normalizer`

#### Returns

`Normalizer`

## Methods

### \_canonicalizeRfc8785()

> `protected` **\_canonicalizeRfc8785**(`value`): `string`

Recursively builds a byte-identical RFC 8785 JSON string.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `value` | `unknown` |

#### Returns

`string`

#### Throws

For non-JSON-serializable types (non-finite numbers, Date, RegExp,
  Map, Set, class instances, function, symbol, bigint, undefined).
  Callers must wrap in captureResult.

***

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

***

### \_normalizeArray()

> `protected` **\_normalizeArray**(`from`): [`Result`](../type-aliases/Result.md)\<`unknown`[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown`[] |

#### Returns

[`Result`](../type-aliases/Result.md)\<`unknown`[]\>

***

### canonicalize()

> **canonicalize**(`from`): [`Result`](../type-aliases/Result.md)\<`string`\>

Produces a stable, byte-identical JSON string following RFC 8785
(JSON Canonicalization Scheme) key-ordering rules.

Builds the output string directly rather than constructing an intermediate
JS object, so integer-string keys (`"10"`, `"2"`) retain lexicographic
order instead of being reordered numerically by the JS engine during
`JSON.stringify`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | Any JSON-compatible value (string, number, boolean, null, plain object, or array). Fails for non-JSON types (Map, Set, Date, RegExp, function, symbol, bigint, undefined). |

#### Returns

[`Result`](../type-aliases/Result.md)\<`string`\>

`Result<string>` — the canonical JSON string, or a failure if
  `from` contains non-serializable types.

***

### normalize()

> **normalize**\<`T`\>(`from`): [`Result`](../type-aliases/Result.md)\<`T`\>

Normalizes the supplied value

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

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
| <a id="type-parameter-t-1"></a> `T` | `unknown` |

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
| <a id="type-parameter-t-2"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `T` | The literal value to be normalized. |

#### Returns

[`Result`](../type-aliases/Result.md)\<`T`\>

A normalized value for the literal.
