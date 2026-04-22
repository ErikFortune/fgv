[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / GroupedEntityList

# Function: GroupedEntityList()

> **GroupedEntityList**\<`TEntity`, `TId`\>(`props`): `ReactElement`

Entity list with sticky group headers.

Groups entities by a key extracted via the descriptor, renders a sticky
header per group, and delegates item rendering to the same visual pattern
as [EntityList](EntityList.md).

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEntity` | - |
| `TId` *extends* `string` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`IGroupedEntityListProps`](../interfaces/IGroupedEntityListProps.md)\<`TEntity`, `TId`\> |

## Returns

`ReactElement`
