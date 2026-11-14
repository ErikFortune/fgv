[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / DeltaGenerator

# Class: DeltaGenerator

Class for generating resource deltas between baseline and delta resolvers.
Creates partial/augment candidates for updated resources and full/replace candidates for new resources.
Uses Diff.jsonThreeWayDiff for efficient delta computation.

## Constructors

### Constructor

> `protected` **new DeltaGenerator**(`params`): `DeltaGenerator`

**`Internal`**

Constructor for a DeltaGenerator object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IDeltaGeneratorParams`](../interfaces/IDeltaGeneratorParams.md) | Parameters to create a new DeltaGenerator. |

#### Returns

`DeltaGenerator`

## Methods

### generate()

> **generate**(`options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md)\>

Generates deltas between baseline and delta resolvers.
Creates a cloned resource manager with partial/augment candidates for updates
and full/replace candidates for new resources.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IDeltaGeneratorOptions`](../interfaces/IDeltaGeneratorOptions.md) | Options controlling delta generation behavior. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md)\>

`Success` with the updated resource manager if successful,
or `Failure` with an error message if not.

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`DeltaGenerator`\>

Creates a new DeltaGenerator object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IDeltaGeneratorParams`](../interfaces/IDeltaGeneratorParams.md) | Parameters to create a new DeltaGenerator. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`DeltaGenerator`\>

`Success` with the new DeltaGenerator object if successful,
or `Failure` with an error message if not.
