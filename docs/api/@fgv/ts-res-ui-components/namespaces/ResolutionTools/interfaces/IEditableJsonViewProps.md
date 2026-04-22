[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IEditableJsonViewProps

# Interface: IEditableJsonViewProps

Props for the EditableJsonView component.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS classes |
| <a id="disabled"></a> `disabled?` | `boolean` | Whether editing is currently disabled |
| <a id="editedvalue"></a> `editedValue?` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The current edited value if any |
| <a id="isedited"></a> `isEdited?` | `boolean` | Whether this resource has been edited |
| <a id="oncancel"></a> `onCancel?` | (`resourceId`) => `void` | Callback when the user cancels an edit |
| <a id="onsave"></a> `onSave?` | (`resourceId`, `editedValue`, `originalValue`) => `void` | Callback when the user saves an edit |
| <a id="resourceid"></a> `resourceId` | `string` | The resource ID for tracking edits |
| <a id="value"></a> `value` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The original JSON value |
