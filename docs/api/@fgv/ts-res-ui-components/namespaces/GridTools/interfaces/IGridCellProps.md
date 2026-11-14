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
| <a id="property-classname"></a> `className?` | `string` | Additional CSS classes |
| <a id="property-column"></a> `column` | [`IGridColumnDefinition`](IGridColumnDefinition.md) | The column definition for this cell |
| <a id="property-isedited"></a> `isEdited` | `boolean` | Whether this cell has been edited |
| <a id="property-resolvedvalue"></a> `resolvedValue` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The complete resolved resource value |
| <a id="property-resourceid"></a> `resourceId` | `string` | The resource ID for this row |
| <a id="property-value"></a> `value` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The extracted value for this cell |
