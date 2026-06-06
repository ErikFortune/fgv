[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / getPendingResourceStats

# Function: getPendingResourceStats()

> **getPendingResourceStats**(`pendingResources`): `object`

Gets statistics about pending resources.
Provides summary information useful for UI displays.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `pendingResources` | `Map`\<`string`, [`ILooseResourceDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\> | Map of pending resources |

## Returns

`object`

Statistics object with counts and breakdowns

| Name | Type |
| ------ | ------ |
| `byType` | `Record`\<`string`, `number`\> |
| `resourceIds` | `string`[] |
| `totalCount` | `number` |

## Example

```typescript
const stats = getPendingResourceStats(pendingResources);
console.log(`${stats.totalCount} pending resources`);
console.log(`Types: ${Object.keys(stats.byType).join(', ')}`);
```
