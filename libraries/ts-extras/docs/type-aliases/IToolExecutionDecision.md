[Home](../README.md) > IToolExecutionDecision

# Type Alias: IToolExecutionDecision

Decision returned by an IExecuteClientToolTurnParams.onBeforeToolExecute
gate for a single client-tool call.

## Type

```typescript
type IToolExecutionDecision = { action: "proceed" } | { action: "deny"; reason: string }
```
