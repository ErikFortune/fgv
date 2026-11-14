[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ResourceTypes](../README.md) / createResourceTypeFromConfig

# Function: createResourceTypeFromConfig()

> **createResourceTypeFromConfig**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

Creates a [ResourceType](../../../classes/ResourceType.md) from a configuration object.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`IResourceTypeConfig`](../namespaces/Config/interfaces/IResourceTypeConfig.md) | The [configuration object](../namespaces/Config/interfaces/IResourceTypeConfig.md) containing the name and type name of the resource type. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

`Success` with the new [ResourceType](../../../classes/ResourceType.md)
if successful, `Failure` with an error message otherwise.
