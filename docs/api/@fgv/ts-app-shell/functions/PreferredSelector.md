[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / PreferredSelector

# Function: PreferredSelector()

> **PreferredSelector**\<`TId`\>(`props`): `ReactElement`

Compact inline selector with popover for choosing one item from a set.

When there is only one item, renders as a static label.
When there are multiple items, renders a clickable trigger that opens
a popover with all options. If `onCompare` is provided, the popover
includes a compare toggle that enables checkboxes for multi-select,
with "Compare All" and "Compare Selected" actions.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TId` *extends* `string` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`IPreferredSelectorProps`](../interfaces/IPreferredSelectorProps.md)\<`TId`\> |

## Returns

`ReactElement`
