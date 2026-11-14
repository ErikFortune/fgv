[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IEntityRowProps

# Interface: IEntityRowProps\<TId\>

Props for the EntityRow component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tid"></a> `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-items"></a> `items` | `readonly` | readonly [`ISelectableItem`](ISelectableItem.md)\<`TId`\>[] | All options (preferred + alternates). If length === 1, no swap icon is shown. |
| <a id="property-label"></a> `label?` | `readonly` | `string` | Optional section label displayed above the row |
| <a id="property-onclick"></a> `onClick?` | `readonly` | (`id`) => `void` | Callback when the row is clicked (drill-down navigation) |
| <a id="property-oncompare"></a> `onCompare?` | `readonly` | (`ids`) => `void` | Callback to compare items. When provided, popover shows compare buttons. |
| <a id="property-onselect"></a> `onSelect?` | `readonly` | (`id`) => `void` | Callback when the displayed item changes via the swap picker |
| <a id="property-preferredid"></a> `preferredId?` | `readonly` | `TId` | ID of the preferred/default item (shows ★ marker) |
| <a id="property-rightcontent"></a> `rightContent?` | `readonly` | `ReactNode` | Optional right-side content rendered before the › chevron |
| <a id="property-selectedid"></a> `selectedId?` | `readonly` | `TId` | Controlled selected ID (overrides internal state). Use with onSelect. |
