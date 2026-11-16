[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ICreateMessageOptions

# Interface: ICreateMessageOptions

Options for [createMessage](../functions/createMessage.md) (and `addMessage`).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-action"></a> `action?` | `readonly` | [`IMessageAction`](../type-aliases/IMessageAction.md) | Optional action (e.g., a link or callback). |
| <a id="property-severity"></a> `severity?` | `readonly` | [`MessageSeverity`](../type-aliases/MessageSeverity.md) | Explicit display styling override. Omit to derive styling from the level via [deriveSeverityFromLevel](../functions/deriveSeverityFromLevel.md). Set to `'success'` for UI-originated success messages. |
