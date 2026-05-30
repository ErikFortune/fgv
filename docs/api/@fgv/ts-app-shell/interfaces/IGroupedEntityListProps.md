[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IGroupedEntityListProps

# Interface: IGroupedEntityListProps\<TEntity, TId\>

Props for the [GroupedEntityList](../functions/GroupedEntityList.md) component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TEntity` | - |
| `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="candelete"></a> `canDelete?` | `readonly` | (`id`) => `boolean` | Predicate to control per-entity delete button visibility. |
| <a id="checkedids"></a> `checkedIds?` | `readonly` | `ReadonlySet`\<`string`\> | Entity IDs currently checked for comparison. |
| <a id="comparecount"></a> `compareCount?` | `readonly` | `number` | Number of items selected for comparison. |
| <a id="comparemode"></a> `compareMode?` | `readonly` | `boolean` | Whether compare mode is active. |
| <a id="descriptor"></a> `descriptor` | `readonly` | [`IEntityGroupDescriptor`](IEntityGroupDescriptor.md)\<`TEntity`, `TId`\> | Descriptor for extracting display and grouping properties. |
| <a id="emptystate"></a> `emptyState?` | `readonly` | [`IEmptyStateConfig`](IEmptyStateConfig.md) | Empty state configuration. |
| <a id="entities"></a> `entities` | `readonly` | readonly `TEntity`[] | The entities to display (pre-sorted within groups by the caller). |
| <a id="oncheckedchange"></a> `onCheckedChange?` | `readonly` | (`id`) => `void` | Callback to toggle an entity ID in/out of compare selection. |
| <a id="ondelete"></a> `onDelete?` | `readonly` | (`id`) => `void` | Callback to delete an entity. |
| <a id="ondrill"></a> `onDrill?` | `readonly` | () => `void` | Callback when the user drills into the selected entity (Enter/Arrow Right — collapses list). |
| <a id="onselect"></a> `onSelect` | `readonly` | (`id`) => `void` | Callback when an entity is selected (browse — list stays open). |
| <a id="onstartcomparison"></a> `onStartComparison?` | `readonly` | () => `void` | Callback to start comparison view. |
| <a id="ontogglecompare"></a> `onToggleCompare?` | `readonly` | () => `void` | Callback to toggle compare mode. |
| <a id="selectedid"></a> `selectedId?` | `readonly` | `TId` | Currently selected entity ID (if any). |
