[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / createResourceTypeFactory

# Function: createResourceTypeFactory()

> **createResourceTypeFactory**(`fn`): [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

Creates a [IConfigInitFactory](../interfaces/IConfigInitFactory.md) from a resource type factory function.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fn` | [`ResourceTypeFactoryFunction`](../type-aliases/ResourceTypeFactoryFunction.md) | The factory function to wrap. |

## Returns

[`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

An `IConfigInitFactory` instance that delegates to the function.
