[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > toolConflictPolicy

## IExecuteClientToolTurnParams.toolConflictPolicy property

What to do when this provider declares one of the requested server tools
mutually exclusive with client tools (see
AiAssist.IAiProviderDescriptor.serverToolsExclusiveWithClientTools). Defaults to
`'drop-server-tools'` — the client tools this host registered for the turn are
kept and the server tool is dropped.

**Signature:**

```typescript
readonly toolConflictPolicy: AiToolConflictPolicy;
```
