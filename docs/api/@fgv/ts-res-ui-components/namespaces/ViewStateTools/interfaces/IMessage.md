[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ViewStateTools](../README.md) / IMessage

# Interface: IMessage

Message type definition for the MessagesWindow component.

Extends the basic message structure with additional properties for enhanced
message management and display.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | Unique identifier for the message |
| <a id="message"></a> `message` | `string` | The message content to display |
| <a id="timestamp"></a> `timestamp` | `Date` | Timestamp when the message was created |
| <a id="type"></a> `type` | `"error"` \| `"success"` \| `"info"` \| `"warning"` | Message type determining visual styling and filtering |
