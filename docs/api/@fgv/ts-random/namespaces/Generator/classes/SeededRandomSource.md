[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-random](../../../README.md) / [Generator](../README.md) / SeededRandomSource

# Class: SeededRandomSource

Seeded random number generator that can be cloned and used for deterministic generation.

## Constructors

### Constructor

> `protected` **new SeededRandomSource**(`init`): `SeededRandomSource`

Creates a new seeded random source.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init` | [`ISeededRandomSourceConstructorParams`](../interfaces/ISeededRandomSourceConstructorParams.md) | The constructor parameters. |

#### Returns

`SeededRandomSource`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="lineage"></a> `lineage` | `readonly` | readonly `string`[] |
| <a id="seed"></a> `seed` | `readonly` | `string` |

## Accessors

### counter

#### Get Signature

> **get** **counter**(): `number`

Gets the current counter value.

##### Returns

`number`

## Methods

### clone()

> **clone**(): `SeededRandomSource`

Creates a clone of this random source.

#### Returns

`SeededRandomSource`

A new seeded random source with the same state.

***

### createChild()

> **createChild**(`label`): `SeededRandomSource`

Creates a child random source with a label.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `label` | `string` | The label for the child. |

#### Returns

`SeededRandomSource`

A new seeded random source with a hashed state and label.

***

### next()

> **next**(): `number`

Generates the next random number.

#### Returns

`number`

A random number between 0 and 1.

***

### create()

#### Call Signature

> `static` **create**(`seed?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SeededRandomSource`\>

Creates a new seeded random source from an optional seed.

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `seed?` | `string` \| `number` | The optional seed value. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SeededRandomSource`\>

A new seeded random source.

#### Call Signature

> `static` **create**(`init`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SeededRandomSource`\>

Creates a new seeded random source from [ISeededRandomSourceCreateParams](../interfaces/ISeededRandomSourceCreateParams.md).

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init` | [`ISeededRandomSourceCreateParams`](../interfaces/ISeededRandomSourceCreateParams.md) | The initialization parameters. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SeededRandomSource`\>

A new seeded random source.

***

### hashSeed()

> `static` **hashSeed**(`seed`): [`ISeedPair`](../interfaces/ISeedPair.md)

Hashes a seed value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `seed` | `string` \| `number` | The seed value. |

#### Returns

[`ISeedPair`](../interfaces/ISeedPair.md)

A hashed seed value.

***

### hashStateAndLabel()

> `static` **hashStateAndLabel**(`state`, `label`): [`ISeedPair`](../interfaces/ISeedPair.md)

Hashes a state and label.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `state` | `number` | The state value. |
| `label` | `string` | The label value. |

#### Returns

[`ISeedPair`](../interfaces/ISeedPair.md)

A hashed state and label value.

***

### mulberryStep()

> `static` **mulberryStep**(`currentState`): [`INextResult`](../interfaces/INextResult.md)

Steps a mulberry32 random number generator state and returns the next value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `currentState` | `number` | The current state of the generator. |

#### Returns

[`INextResult`](../interfaces/INextResult.md)

The next random number and the next state.
