[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / getPendingResourceTypes

# Function: getPendingResourceTypes()

> **getPendingResourceTypes**(`pendingResources`): `string`[]

Gets all unique resource types from pending resources.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pendingResources` | `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> | Map of pending resources |

## Returns

`string`[]

Array of unique resource type names

## Example

```typescript
const types = getPendingResourceTypes(pendingResources);
console.log(types); // ['json', 'string', 'languageConfig']
```
