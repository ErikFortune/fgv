[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IMessageAction

# Type Alias: IMessageAction

> **IMessageAction** = [`IMessageHrefAction`](../interfaces/IMessageHrefAction.md) \| [`IMessageCallbackAction`](../interfaces/IMessageCallbackAction.md)

An actionable element attached to a message — either an external link
([IMessageHrefAction](../interfaces/IMessageHrefAction.md)) or a callback ([IMessageCallbackAction](../interfaces/IMessageCallbackAction.md)).
The discriminated-union shape makes "exactly one of `href` or `onAction`"
an enforced contract at type-check time, so callers cannot accidentally
supply both or neither.
