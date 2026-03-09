[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / ResultMapValidator

# Class: ResultMapValidator\<TK, TV\>

A [ResultMap](ResultMap.md) wrapper which validates weakly-typed keys
before calling the wrapped result map.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TK` *extends* `string` | `string` |
| `TV` | `unknown` |

## Implements

- [`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md)\<`TK`, `TV`\>

## Constructors

### Constructor

> **new ResultMapValidator**\<`TK`, `TV`\>(`params`): `ResultMapValidator`\<`TK`, `TV`\>

Constructs a new ResultMapValidator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IResultMapValidatorCreateParams`](../interfaces/IResultMapValidatorCreateParams.md)\<`TK`, `TV`\> | Required parameters for constructing the result map validator. |

#### Returns

`ResultMapValidator`\<`TK`, `TV`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="_map"></a> `_map` | `protected` | [`ResultMap`](ResultMap.md)\<`TK`, `TV`\> |
| <a id="converters"></a> `converters` | `readonly` | [`KeyValueConverters`](KeyValueConverters.md)\<`TK`, `TV`\> |

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

### \_isResultMapValueFactory()

> **\_isResultMapValueFactory**\<`TK`, `TV`\>(`value`): `value is ResultMapValueFactory<TK, TV>`

Determines if a value is a [ResultMapValueFactory](../type-aliases/ResultMapValueFactory.md).

#### Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TV` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `TV` \| [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<`TK`, `TV`\> | The value to check. |

#### Returns

`value is ResultMapValueFactory<TK, TV>`

`true` if the value is a [ResultMapValueFactory](../type-aliases/ResultMapValueFactory.md),
`false` otherwise.

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map if the key does not already exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to set. |
| `value` | `unknown` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `added` if the key was added,
`Failure` with detail `exists` if the key already exists. Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

***

### delete()

> **delete**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Deletes a key from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to delete. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the previous value and the detail 'deleted'
if the key was found and deleted, `Failure` with detail 'not-found'
if the key was not found, or with detail 'invalid-key' if the key is invalid.

***

### get()

> **get**(`key`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to retrieve. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Implementation of

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`get`](../interfaces/IReadOnlyResultMapValidator.md#get)

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map, or adds a supplied value it if it does not exist.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to be retrieved or created. |
| `value` | `unknown` | The value to add if the key does not exist. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found,
`Success` with the value and detail `added` if the key was not found and added.
Fails with detail 'invalid-key' or 'invalid-value' and an error message if either
is invalid.

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Gets a value from the map, or adds a value created by a factory function if it does not exist.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key of the element to be retrieved or created. |
| `factory` | [`ResultMapValueFactory`](../type-aliases/ResultMapValueFactory.md)\<`TK`, `TV`\> | A [factory function](../type-aliases/ResultMapValueFactory.md) to create the value if the key does not exist. |

##### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail `exists` if the key was found, `Success` with
the value and detail `added` if the key was not found and added. Fails with detail 'invalid-key'
or 'invalid-value' and an error message if either is invalid.

***

### has()

> **has**(`key`): `boolean`

Returns `true` if the map contains a key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to check. |

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Implementation of

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md).[`has`](../interfaces/IReadOnlyResultMapValidator.md#has)

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Sets a key/value pair in the map.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to set. |
| `value` | `unknown` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the new value and the detail `updated` if the
key was found and updated, `Success` with the new value and detail
`added` if the key was not found and added.  Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md)\<`TK`, `TV`\>

Gets a read-only version of this validator.

#### Returns

[`IReadOnlyResultMapValidator`](../interfaces/IReadOnlyResultMapValidator.md)\<`TK`, `TV`\>

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

Updates an existing key in the map - the map is not updated if the key does
not exist.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to update. |
| `value` | `unknown` | The value to set. |

#### Returns

[`DetailedResult`](../../../../type-aliases/DetailedResult.md)\<`TV`, [`ResultMapResultDetail`](../type-aliases/ResultMapResultDetail.md)\>

`Success` with the value and detail 'exists' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.
