[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IEntityListProps

# Interface: IEntityListProps\<TEntity, TId\>

Props for the EntityList component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tentity"></a> `TEntity` | - |
| <a id="type-parameter-tid"></a> `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candelete"></a> `canDelete?` | `readonly` | (`id`) => `boolean` | Optional predicate to control per-entity delete button visibility. When `onDelete` is provided but `canDelete` is not, all rows show the delete button. When both are provided, only rows where `canDelete(id)` returns true show the button. |
| <a id="property-checkedids"></a> `checkedIds?` | `readonly` | `ReadonlySet`\<`string`\> | Entity IDs currently checked for comparison |
| <a id="property-comparecount"></a> `compareCount?` | `readonly` | `number` | Number of items currently selected for comparison |
| <a id="property-comparemode"></a> `compareMode?` | `readonly` | `boolean` | Whether compare mode is active (shows checkboxes for multi-select) |
| <a id="property-descriptor"></a> `descriptor` | `readonly` | [`IEntityDescriptor`](IEntityDescriptor.md)\<`TEntity`, `TId`\> | Descriptor for extracting display properties |
| <a id="property-emptystate"></a> `emptyState?` | `readonly` | [`IEmptyStateConfig`](IEmptyStateConfig.md) | Empty state configuration |
| <a id="property-entities"></a> `entities` | `readonly` | readonly `TEntity`[] | The entities to display |
| <a id="property-header"></a> `header?` | `readonly` | `ReactNode` | Optional header content (e.g., result count) |
| <a id="property-oncheckedchange"></a> `onCheckedChange?` | `readonly` | (`id`) => `void` | Callback to toggle an entity ID in/out of the compare selection |
| <a id="property-ondelete"></a> `onDelete?` | `readonly` | (`id`) => `void` | Optional callback to delete an entity. When provided, a delete button appears on each row (visible on hover/selection). The consumer is responsible for showing a confirmation dialog before calling this. |
| <a id="property-ondrill"></a> `onDrill?` | `readonly` | () => `void` | Callback when the user drills into the selected entity (Enter/→ — collapses list) |
| <a id="property-onselect"></a> `onSelect` | `readonly` | (`id`) => `void` | Callback when an entity is selected (browse — list stays open) |
| <a id="property-onstartcomparison"></a> `onStartComparison?` | `readonly` | () => `void` | Callback to start the comparison view (user clicks 'Compare Now') |
| <a id="property-ontogglecompare"></a> `onToggleCompare?` | `readonly` | () => `void` | Callback to toggle compare mode on/off (shows compare button in header) |
| <a id="property-selectedid"></a> `selectedId?` | `readonly` | `TId` | Currently selected entity ID (if any) |
