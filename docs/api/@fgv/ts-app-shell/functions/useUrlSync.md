[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useUrlSync

# Function: useUrlSync()

> **useUrlSync**\<`TMode`, `TTab`\>(`config`, `state`, `callbacks`): `void`

Hook that synchronizes two-tier mode/tab navigation state with the URL hash.

- On mount: reads the URL hash and applies it to the store
- On state change: updates the URL hash (pushes history entry)
- On popstate (back/forward): reads the URL hash and applies it to the store

Should be called once at the app root level.

## Type Parameters

| Type Parameter |
| ------ |
| `TMode` *extends* `string` |
| `TTab` *extends* `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`IUrlSyncConfig`](../interfaces/IUrlSyncConfig.md)\<`TMode`, `TTab`\> | Validation configuration (modes, tabs, defaults) |
| `state` | [`IUrlSyncState`](../interfaces/IUrlSyncState.md)\<`TMode`, `TTab`\> | Current navigation state |
| `callbacks` | [`IUrlSyncCallbacks`](../interfaces/IUrlSyncCallbacks.md)\<`TMode`, `TTab`\> | State mutation callbacks |

## Returns

`void`
