[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / createMessage

# Function: createMessage()

> **createMessage**(`level`, `text`, `options?`): [`IMessage`](../interfaces/IMessage.md)

Creates a new message at the given canonical @fgv/ts-utils#MessageLogLevel \| log level.
The level drives filtering; pass `options.severity` only to override display styling
(e.g. `'success'`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `level` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | The canonical log level (filter axis). |
| `text` | `string` | The message text. |
| `options?` | [`ICreateMessageOptions`](../interfaces/ICreateMessageOptions.md) | Optional styling severity and action. |

## Returns

[`IMessage`](../interfaces/IMessage.md)

The created message.
