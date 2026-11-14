[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / BuiltInResourceTypeFactory

# Class: BuiltInResourceTypeFactory

A factory that creates a [ResourceType](../../../classes/ResourceType.md) from a [resource type configuration](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md).

## Implements

- [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md), [`ResourceType`](../../../classes/ResourceType.md)\>

## Constructors

### Constructor

> **new BuiltInResourceTypeFactory**(): `BuiltInResourceTypeFactory`

#### Returns

`BuiltInResourceTypeFactory`

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

#### Implementation of

[`IConfigInitFactory`](../interfaces/IConfigInitFactory.md).[`create`](../interfaces/IConfigInitFactory.md#create)
