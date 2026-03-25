[**@fgv/ts-json**](../README.md)

***

[@fgv/ts-json](../README.md) / IJsonEditorValidationOptions

# Interface: IJsonEditorValidationOptions

Validation options for a [JsonEditor](../classes/JsonEditor.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="oninvalidpropertyname"></a> `onInvalidPropertyName` | `"error"` \| `"ignore"` | If `onInvalidPropertyName` is `'error'` (default) then any property name that is invalid after template rendering causes an error and stops conversion. If `onInvalidPropertyName` is `'ignore'`, then names which are invalid after template rendering are passed through unchanged. |
| <a id="oninvalidpropertyvalue"></a> `onInvalidPropertyValue` | `"error"` \| `"ignore"` | If `onInvalidPropertyValue` is `'error'` (default) then any illegal property value other than `undefined` causes an error and stops conversion. If `onInvalidPropertyValue` is `'ignore'` then any invalid property values are silently ignored. |
| <a id="onundefinedpropertyvalue"></a> `onUndefinedPropertyValue` | `"error"` \| `"ignore"` | If `onUndefinedPropertyValue` is `'error'`, then any property with value `undefined` will cause an error and stop conversion. If `onUndefinedPropertyValue` is `'ignore'` (default) then any property with value `undefined` is silently ignored. |
