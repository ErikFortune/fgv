[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IEditedResourceInfo

# Interface: IEditedResourceInfo\<T, TV\>

Information about a resource being edited in the resolution view.
Tracks changes to resource values and states.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | `unknown` |
| <a id="type-parameter-tv"></a> `TV` *extends* [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | [`JsonCompatibleType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-editedvalue"></a> `editedValue` | `TV` | - |
| <a id="property-originalvalue"></a> `originalValue` | `TV` | - |
| <a id="property-resourceid"></a> `resourceId` | `string` | Unique identifier of the resource being edited |
| <a id="property-timestamp"></a> `timestamp` | `Date` | - |
