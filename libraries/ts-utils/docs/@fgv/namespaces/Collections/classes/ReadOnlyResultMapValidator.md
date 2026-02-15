[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ReadOnlyResultMapValidator

# Class: ReadOnlyResultMapValidator\<TK, TV\>

A read-only validator for any [IReadOnlyResultMap](../interfaces/IReadOnlyResultMap.md)
that validates weakly-typed keys before accessing values.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Implements

- [`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md)\<`TK`, `TV`\>

## Constructors

### Constructor

> **new ReadOnlyResultMapValidator**\<`TK`, `TV`\>(`map`, `converters`): `ReadOnlyResultMapValidator`\<`TK`, `TV`\>

Constructs a new ReadOnlyResultMapValidator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `map` | [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TV`\> | The map to validate access to. |
| `converters` | [`KeyValueConverters`](KeyValueConverters.md)\<`TK`, `TV`\> | The key-value converters for validation. |

#### Returns

`ReadOnlyResultMapValidator`\<`TK`, `TV`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="converters"></a> `converters` | `readonly` | [`KeyValueConverters`](KeyValueConverters.md)\<`TK`, `TV`\> | The key-value converters used for validation. |

## Accessors

### map

#### Get Signature

> **get** **map**(): [`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TV`\>

The underlying map.

##### Returns

[`IReadOnlyResultMap`](../interfaces/IReadOnlyResultMap.md)\<`TK`, `TV`\>

The underlying map.

#### Implementation of

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`map`](../interfaces/IReadOnlyResultMapValidator.md#map)

## Methods

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map by key, validating the key first.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to retrieve (will be validated). |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value if found, `Failure` otherwise.

#### Implementation of

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`get`](../interfaces/IReadOnlyResultMapValidator.md#get)

***

### has()

> **has**(`key`): `boolean`

Checks if the map contains a key, validating the key first.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to check (will be validated). |

#### Returns

`boolean`

`true` if the key exists and is valid, `false` otherwise.

#### Implementation of

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`has`](../interfaces/IReadOnlyResultMapValidator.md#has)
