[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IPreferredSelectorProps

# Interface: IPreferredSelectorProps\<TId\>

Props for the PreferredSelector component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="items"></a> `items` | `readonly` | readonly [`ISelectableItem`](ISelectableItem.md)\<`TId`\>[] | Available items to choose from |
| <a id="label"></a> `label?` | `readonly` | `string` | Section title displayed above the trigger |
| <a id="oncompare"></a> `onCompare?` | `readonly` | (`ids`) => `void` | Callback to compare selected items side-by-side. Receives the IDs to compare. |
| <a id="ondrilldown"></a> `onDrillDown?` | `readonly` | (`id`) => `void` | Callback for drill-down navigation on an item (shows › chevron per row) |
| <a id="onselect"></a> `onSelect` | `readonly` | (`id`) => `void` | Callback when an item is selected |
| <a id="preferredid"></a> `preferredId?` | `readonly` | `TId` | ID of the preferred/default item (shows ★ marker) |
| <a id="selectedid"></a> `selectedId` | `readonly` | `TId` | Currently selected item ID |
