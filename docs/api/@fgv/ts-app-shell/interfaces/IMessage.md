[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IMessage

# Interface: IMessage

A single message in the observability stream.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | [`IMessageAction`](../type-aliases/IMessageAction.md) | Optional action (e.g., a link or callback) |
| <a id="property-id"></a> `id` | `readonly` | `string` | Unique message ID |
| <a id="property-level"></a> `level` | `readonly` | [`MessageLogLevel`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Canonical @fgv/ts-utils#MessageLogLevel \| log level — drives FILTERING. Set losslessly from a ts-utils logger when a message originates from the logger bridge. |
| <a id="property-severity"></a> `severity?` | `readonly` | [`MessageSeverity`](../type-aliases/MessageSeverity.md) | Display styling override (color / icon / toast). Optional; when absent, styling is derived from [IMessage.level](#property-level) via [deriveSeverityFromLevel](../functions/deriveSeverityFromLevel.md). `'success'` lives here — set explicitly for UI-originated messages, never from a logger bridge. |
| <a id="property-text"></a> `text` | `readonly` | `string` | Message text |
| <a id="property-timestamp"></a> `timestamp` | `readonly` | `number` | Timestamp (ms since epoch) |
