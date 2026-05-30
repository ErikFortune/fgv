[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IEditedResourceInfo

# Interface: IEditedResourceInfo\<T, TV\>

Information about a resource being edited in the resolution view.
Tracks changes to resource values and states.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |
| `TV` *extends* [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="editedvalue"></a> `editedValue` | `TV` | - |
| <a id="originalvalue"></a> `originalValue` | `TV` | - |
| <a id="resourceid"></a> `resourceId` | `string` | Unique identifier of the resource being edited |
| <a id="timestamp"></a> `timestamp` | `Date` | - |
