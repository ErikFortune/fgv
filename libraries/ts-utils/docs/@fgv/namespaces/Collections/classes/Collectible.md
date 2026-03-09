[**@fgv/ts-utils**](../../../../README.md)

***

[@fgv/ts-utils](../../../../README.md) / [Collections](../README.md) / Collectible

# Class: Collectible\<TKEY, TINDEX\>

Simple implementation of [ICollectible](../interfaces/ICollectible.md) which does not allow the index to be
changed once set.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKEY` *extends* `string` | `string` |
| `TINDEX` *extends* `number` | `number` |

## Implements

- [`ICollectible`](../interfaces/ICollectible.md)\<`TKEY`, `TINDEX`\>

## Constructors

### Constructor

> **new Collectible**\<`TKEY`, `TINDEX`\>(`params`): `Collectible`\<`TKEY`, `TINDEX`\>

Constructs a new Collectible instance
with a defined, strongly-typed index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICollectibleConstructorParamsWithIndex`](../interfaces/ICollectibleConstructorParamsWithIndex.md)\<`TKEY`, `TINDEX`\> | [Parameters](../interfaces/ICollectibleConstructorParamsWithIndex.md) for constructing the collectible. |

#### Returns

`Collectible`\<`TKEY`, `TINDEX`\>

### Constructor

> **new Collectible**\<`TKEY`, `TINDEX`\>(`params`): `Collectible`\<`TKEY`, `TINDEX`\>

Constructs a new Collectible instance with
an undefined index and an index converter to validate te index when it is set.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICollectibleConstructorParamsWithConverter`](../interfaces/ICollectibleConstructorParamsWithConverter.md)\<`TKEY`, `TINDEX`\> | [Parameters](../interfaces/ICollectibleConstructorParamsWithConverter.md) for constructing the collectible. |

#### Returns

`Collectible`\<`TKEY`, `TINDEX`\>

### Constructor

> **new Collectible**\<`TKEY`, `TINDEX`\>(`params`): `Collectible`\<`TKEY`, `TINDEX`\>

Constructs a new Collectible instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICollectibleConstructorParams`](../type-aliases/ICollectibleConstructorParams.md)\<`TKEY`, `TINDEX`\> | [Parameters](../type-aliases/ICollectibleConstructorParams.md) for constructing the collectible. |

#### Returns

`Collectible`\<`TKEY`, `TINDEX`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_index"></a> `_index` | `protected` | `TINDEX` \| `undefined` | - |
| <a id="_indexconverter"></a> `_indexConverter?` | `readonly` | [`Validator`](../../Validation/interfaces/Validator.md)\<`TINDEX`, `unknown`\> \| [`Converter`](../../Conversion/interfaces/Converter.md)\<`TINDEX`, `unknown`\> | - |
| <a id="key"></a> `key` | `readonly` | `TKEY` | [Collections.ICollectible.key](../interfaces/ICollectible.md#key) |

## Accessors

### index

#### Get Signature

> **get** **index**(): `TINDEX` \| `undefined`

[Collections.ICollectible.index](../interfaces/ICollectible.md#index)

##### Returns

`TINDEX` \| `undefined`

#### Implementation of

[`ICollectible`](../interfaces/ICollectible.md).[`index`](../interfaces/ICollectible.md#index)

## Methods

### setIndex()

> **setIndex**(`index`): [`Result`](../../../../type-aliases/Result.md)\<`TINDEX`\>

[Collections.ICollectible.setIndex](../interfaces/ICollectible.md#setindex)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `index` | `number` |

#### Returns

[`Result`](../../../../type-aliases/Result.md)\<`TINDEX`\>

#### Implementation of

[`ICollectible`](../interfaces/ICollectible.md).[`setIndex`](../interfaces/ICollectible.md#setindex)

***

### createCollectible()

#### Call Signature

> `static` **createCollectible**\<`TKEY`, `TINDEX`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`Collectible`\<`TKEY`, `TINDEX`\>\>

Creates a new Collectible instance with a defined, strongly-typed index.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKEY` *extends* `string` | `string` |
| `TINDEX` *extends* `number` | `number` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICollectibleConstructorParamsWithIndex`](../interfaces/ICollectibleConstructorParamsWithIndex.md)\<`TKEY`, `TINDEX`\> | [Parameters](../interfaces/ICollectibleConstructorParamsWithIndex.md) for constructing the collectible. |

##### Returns

[`Result`](../../../../type-aliases/Result.md)\<`Collectible`\<`TKEY`, `TINDEX`\>\>

[Success](../../../../classes/Success.md) with the new collectible if successful, [Failure](../../../../classes/Failure.md) otherwise.

#### Call Signature

> `static` **createCollectible**\<`TKEY`, `TINDEX`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`Collectible`\<`TKEY`, `TINDEX`\>\>

Creates a new Collectible instance with an undefined index and an index
converter to validate the index when it is set.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKEY` *extends* `string` | `string` |
| `TINDEX` *extends* `number` | `number` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICollectibleConstructorParamsWithConverter`](../interfaces/ICollectibleConstructorParamsWithConverter.md)\<`TKEY`, `TINDEX`\> | [Parameters](../interfaces/ICollectibleConstructorParamsWithConverter.md) for constructing the collectible. |

##### Returns

[`Result`](../../../../type-aliases/Result.md)\<`Collectible`\<`TKEY`, `TINDEX`\>\>

[Success](../../../../classes/Success.md) with the new collectible if successful, [Failure](../../../../classes/Failure.md) otherwise.

#### Call Signature

> `static` **createCollectible**\<`TKEY`, `TINDEX`\>(`params`): [`Result`](../../../../type-aliases/Result.md)\<`Collectible`\<`TKEY`, `TINDEX`\>\>

Creates a new Collectible instance.

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TKEY` *extends* `string` | `string` |
| `TINDEX` *extends* `number` | `number` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICollectibleConstructorParams`](../type-aliases/ICollectibleConstructorParams.md)\<`TKEY`, `TINDEX`\> | [Parameters](../type-aliases/ICollectibleConstructorParams.md) for constructing the collectible. |

##### Returns

[`Result`](../../../../type-aliases/Result.md)\<`Collectible`\<`TKEY`, `TINDEX`\>\>

[Success](../../../../classes/Success.md) with the new collectible if successful, [Failure](../../../../classes/Failure.md) otherwise
