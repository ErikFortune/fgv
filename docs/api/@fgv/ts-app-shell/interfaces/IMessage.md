[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IMessage

# Interface: IMessage

A single message in the observability stream.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="action"></a> `action?` | `readonly` | [`IMessageAction`](IMessageAction.md) | Optional action (e.g., a link or callback) |
| <a id="id"></a> `id` | `readonly` | `string` | Unique message ID |
| <a id="severity"></a> `severity` | `readonly` | [`MessageSeverity`](../type-aliases/MessageSeverity.md) | Message severity |
| <a id="text"></a> `text` | `readonly` | `string` | Message text |
| <a id="timestamp"></a> `timestamp` | `readonly` | `number` | Timestamp (ms since epoch) |
