[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IMessagesContextValue

# Interface: IMessagesContextValue

Value provided by the MessagesContext.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-activetoasts"></a> `activeToasts` | `readonly` | readonly [`IMessage`](IMessage.md)[] | Messages currently visible as toasts (not yet dismissed) |
| <a id="property-addmessage"></a> `addMessage` | `readonly` | (`level`, `text`, `options?`) => [`IMessage`](IMessage.md) | Add a message to the stream. The `level` drives filtering; pass `options.severity` only to override display styling (e.g. `'success'`). |
| <a id="property-clearmessages"></a> `clearMessages` | `readonly` | () => `void` | Clear all messages |
| <a id="property-dismissmessage"></a> `dismissMessage` | `readonly` | (`id`) => `void` | Dismiss a specific message (removes from toast display, keeps in log) |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`IMessage`](IMessage.md)[] | All messages in the stream (newest last) |
