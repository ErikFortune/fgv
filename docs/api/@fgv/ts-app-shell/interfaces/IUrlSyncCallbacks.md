[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IUrlSyncCallbacks

# Interface: IUrlSyncCallbacks\<TMode, TTab\>

Callbacks that connect the URL sync hook to the application's state management.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tmode"></a> `TMode` *extends* `string` |
| <a id="type-parameter-ttab"></a> `TTab` *extends* `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-setmode"></a> `setMode` | `readonly` | (`mode`) => `void` | Set the active mode |
| <a id="property-settab"></a> `setTab` | `readonly` | (`tab`) => `void` | Set the active tab |
