[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / getPendingAdditionsByType

# Function: getPendingAdditionsByType()

> **getPendingAdditionsByType**(`pendingResources`, `resourceType`): `object`[]

Gets pending resources filtered by resource type.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pendingResources` | `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> | Map of pending resources (keys are guaranteed to be full resource IDs) |
| `resourceType` | `string` | Resource type to filter by (e.g., 'json', 'string') |

## Returns

`object`[]

Array of pending resources of the specified type

## Example

```typescript
const jsonResources = getPendingAdditionsByType(pendingResources, 'json');
const languageConfigs = getPendingAdditionsByType(pendingResources, 'languageConfig');
```
