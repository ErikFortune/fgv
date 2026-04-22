[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResourceTools](../README.md) / IResourceEditorProps

# Interface: IResourceEditorProps\<T, TV\>

Props that will be passed to custom resource editors created by ResourceEditorFactory.
Custom editors should implement this interface to be compatible with ResolutionView.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
| `TV` *extends* [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS classes |
| <a id="disabled"></a> `disabled?` | `boolean` | Whether editing is currently disabled |
| <a id="editedvalue"></a> `editedValue?` | `TV` | The current edited value if any |
| <a id="isedited"></a> `isEdited?` | `boolean` | Whether this resource has been edited |
| <a id="oncancel"></a> `onCancel?` | (`resourceId`) => `void` | Callback when the user cancels an edit |
| <a id="onsave"></a> `onSave?` | (`resourceId`, `editedValue`, `originalValue`) => `void` | Callback when the user saves an edit |
| <a id="resourceid"></a> `resourceId` | `string` | The resource ID for tracking edits |
| <a id="value"></a> `value` | `TV` | The original JSON value to edit |
