[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IGridCellProps

# Interface: IGridCellProps

Props passed to custom grid cell renderers.

## Extended by

- [`IGridCellEditorProps`](IGridCellEditorProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS classes |
| <a id="column"></a> `column` | [`IGridColumnDefinition`](IGridColumnDefinition.md) | The column definition for this cell |
| <a id="isedited"></a> `isEdited` | `boolean` | Whether this cell has been edited |
| <a id="resolvedvalue"></a> `resolvedValue` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The complete resolved resource value |
| <a id="resourceid"></a> `resourceId` | `string` | The resource ID for this row |
| <a id="value"></a> `value` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The extracted value for this cell |
