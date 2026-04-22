[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / ResourceTypeFactory

# Class: ResourceTypeFactory

A factory that creates a [ResourceType](../../../classes/ResourceType.md) from a [resource type configuration](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)
by chaining a supplied factory with a [built-in factory](BuiltInResourceTypeFactory.md) that handles built-in resource types.

## Extends

- [`ChainedConfigInitFactory`](ChainedConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md), [`ResourceType`](../../../classes/ResourceType.md)\>

## Constructors

### Constructor

> **new ResourceTypeFactory**(`factories`): `ResourceTypeFactory`

Constructor for a resource type factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `factories` | ([`ResourceTypeFactoryFunction`](../type-aliases/ResourceTypeFactoryFunction.md) \| [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>)[] | Array of factories for resource types. Can be: - [IConfigInitFactory](../interfaces/IConfigInitFactory.md) instances - [Factory functions](../type-aliases/ResourceTypeFactoryFunction.md) - A mix of both |

#### Returns

`ResourceTypeFactory`

#### Remarks

The [built-in factory](BuiltInResourceTypeFactory.md) is always added to the end of the chain.

#### Overrides

[`ChainedConfigInitFactory`](ChainedConfigInitFactory.md).[`constructor`](ChainedConfigInitFactory.md#constructor)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="factories"></a> `factories` | `readonly` | [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>[] |

## Methods

### create()

> **create**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

Creates a new instance of a configuration object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md) | The configuration object to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

A result containing the new instance of the configuration object.

#### Inherited from

[`ChainedConfigInitFactory`](ChainedConfigInitFactory.md).[`create`](ChainedConfigInitFactory.md#create)
