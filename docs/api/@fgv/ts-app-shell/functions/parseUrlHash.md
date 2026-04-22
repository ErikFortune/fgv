[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / parseUrlHash

# Function: parseUrlHash()

> **parseUrlHash**\<`TMode`, `TTab`\>(`hash`, `config`): [`IParsedHash`](../interfaces/IParsedHash.md)\<`TMode`, `TTab`\> \| `undefined`

Parses a URL hash string into mode + tab, validated against the config.
Returns undefined if the hash is invalid or empty.

## Type Parameters

| Type Parameter |
| ------ |
| `TMode` *extends* `string` |
| `TTab` *extends* `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hash` | `string` | The hash string (with or without leading '#') |
| `config` | [`IUrlSyncConfig`](../interfaces/IUrlSyncConfig.md)\<`TMode`, `TTab`\> | Validation configuration |

## Returns

[`IParsedHash`](../interfaces/IParsedHash.md)\<`TMode`, `TTab`\> \| `undefined`

Parsed mode and tab, or undefined
