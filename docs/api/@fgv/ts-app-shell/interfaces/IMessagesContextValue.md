[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IMessagesContextValue

# Interface: IMessagesContextValue

Value provided by the MessagesContext.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="activetoasts"></a> `activeToasts` | `readonly` | readonly [`IMessage`](IMessage.md)[] | Messages currently visible as toasts (not yet dismissed) |
| <a id="addmessage"></a> `addMessage` | `readonly` | (`severity`, `text`, `action?`) => [`IMessage`](IMessage.md) | Add a message to the stream |
| <a id="clearmessages"></a> `clearMessages` | `readonly` | () => `void` | Clear all messages |
| <a id="dismissmessage"></a> `dismissMessage` | `readonly` | (`id`) => `void` | Dismiss a specific message (removes from toast display, keeps in log) |
| <a id="messages"></a> `messages` | `readonly` | readonly [`IMessage`](IMessage.md)[] | All messages in the stream (newest last) |
