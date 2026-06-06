[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / EntityList

# Function: EntityList()

> **EntityList**\<`TEntity`, `TId`\>(`props`): `ReactElement`

Generic entity list component for the sidebar.

Renders a scrollable list of entities with:
- Primary label + optional sublabel
- Optional status indicator
- Selection highlighting
- Empty state with optional CTA

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEntity` | - |
| `TId` *extends* `string` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`IEntityListProps`](../interfaces/IEntityListProps.md)\<`TEntity`, `TId`\> |

## Returns

`ReactElement`
