[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IFilterRowProps

# Interface: IFilterRowProps\<TValue\>

Props for the FilterRow component.

## Type Parameters

| Type Parameter |
| ------ |
| `TValue` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="isequal"></a> `isEqual?` | `readonly` | (`a`, `b`) => `boolean` | Custom equality check for values (default: ===) |
| <a id="label"></a> `label` | `readonly` | `string` | Filter label (e.g., 'Categories', 'Tags') |
| <a id="multiple"></a> `multiple?` | `readonly` | `boolean` | Whether multiple selections are allowed (default: true) |
| <a id="onselectionchange"></a> `onSelectionChange` | `readonly` | (`selected`) => `void` | Callback when selection changes |
| <a id="options"></a> `options` | `readonly` | readonly [`IFilterOption`](IFilterOption.md)\<`TValue`\>[] | Available options |
| <a id="selected"></a> `selected` | `readonly` | readonly `TValue`[] | Currently selected values |
