[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IUrlSyncState

# Interface: IUrlSyncState\<TMode, TTab\>

Current navigation state to sync to the URL.

## Type Parameters

| Type Parameter |
| ------ |
| `TMode` *extends* `string` |
| `TTab` *extends* `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="activetab"></a> `activeTab` | `readonly` | `TTab` | Current active tab |
| <a id="mode"></a> `mode` | `readonly` | `TMode` | Current mode |
