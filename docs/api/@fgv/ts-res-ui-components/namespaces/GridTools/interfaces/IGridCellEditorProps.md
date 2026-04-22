[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / IGridCellEditorProps

# Interface: IGridCellEditorProps

Props passed to custom grid cell editors.

## Extends

- [`IGridCellProps`](IGridCellProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS classes |
| <a id="column"></a> `column` | [`IGridColumnDefinition`](IGridColumnDefinition.md) | The column definition for this cell |
| <a id="disabled"></a> `disabled?` | `boolean` | Whether editing is currently disabled |
| <a id="editedvalue"></a> `editedValue?` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The current edited value if any |
| <a id="isedited"></a> `isEdited` | `boolean` | Whether this cell has been edited |
| <a id="oncancel"></a> `onCancel` | () => `void` | Callback when the user cancels an edit |
| <a id="onsave"></a> `onSave` | (`resourceId`, `newValue`, `originalValue`) => `void` | Callback when the user saves an edit |
| <a id="resolvedvalue"></a> `resolvedValue` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The complete resolved resource value |
| <a id="resourceid"></a> `resourceId` | `string` | The resource ID for this row |
| <a id="value"></a> `value` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The extracted value for this cell |
