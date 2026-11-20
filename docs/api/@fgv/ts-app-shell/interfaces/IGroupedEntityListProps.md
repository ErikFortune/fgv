[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IGroupedEntityListProps

# Interface: IGroupedEntityListProps\<TEntity, TId\>

Props for the [GroupedEntityList](../functions/GroupedEntityList.md) component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tentity"></a> `TEntity` | - |
| <a id="type-parameter-tid"></a> `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candelete"></a> `canDelete?` | `readonly` | (`id`) => `boolean` | Predicate to control per-entity delete button visibility. |
| <a id="property-checkedids"></a> `checkedIds?` | `readonly` | `ReadonlySet`\<`string`\> | Entity IDs currently checked for comparison. |
| <a id="property-comparecount"></a> `compareCount?` | `readonly` | `number` | Number of items selected for comparison. |
| <a id="property-comparemode"></a> `compareMode?` | `readonly` | `boolean` | Whether compare mode is active. |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IEntityGroupDescriptor`](IEntityGroupDescriptor.md)\<`TEntity`, `TId`\> | Descriptor for extracting display and grouping properties. |
| <a id="property-emptystate"></a> `emptyState?` | `readonly` | [`IEmptyStateConfig`](IEmptyStateConfig.md) | Empty state configuration. |
| <a id="property-entities"></a> `entities` | `readonly` | readonly `TEntity`[] | The entities to display (pre-sorted within groups by the caller). |
| <a id="property-oncheckedchange"></a> `onCheckedChange?` | `readonly` | (`id`) => `void` | Callback to toggle an entity ID in/out of compare selection. |
| <a id="property-ondelete"></a> `onDelete?` | `readonly` | (`id`) => `void` | Callback to delete an entity. |
| <a id="property-ondrill"></a> `onDrill?` | `readonly` | () => `void` | Callback when the user drills into the selected entity (Enter/Arrow Right — collapses list). |
| <a id="property-onselect"></a> `onSelect` | `readonly` | (`id`) => `void` | Callback when an entity is selected (browse — list stays open). |
| <a id="property-onstartcomparison"></a> `onStartComparison?` | `readonly` | () => `void` | Callback to start comparison view. |
| <a id="property-ontogglecompare"></a> `onToggleCompare?` | `readonly` | () => `void` | Callback to toggle compare mode. |
| <a id="property-selectedid"></a> `selectedId?` | `readonly` | `TId` | Currently selected entity ID (if any). |
