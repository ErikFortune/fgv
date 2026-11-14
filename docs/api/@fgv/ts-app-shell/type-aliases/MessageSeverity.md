[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / MessageSeverity

# Type Alias: MessageSeverity

> **MessageSeverity** = `"info"` \| `"success"` \| `"warning"` \| `"error"`

Display styling levels for messages — drives color, icon, and toast behavior.

This is the styling axis, orthogonal to the @fgv/ts-utils#MessageLogLevel \| log level
filter axis on [IMessage.level](../interfaces/IMessage.md#property-level). `'success'` lives here (a UI affordance with no
log-level analog) and is only ever set explicitly — never derived from a logger bridge.
