[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnResult](./IExecuteClientToolTurnResult.md) > events

## IExecuteClientToolTurnResult.events property

The unified-event iterable. Callers iterate this to drive the streaming UI.
The iterable forwards `text-delta`, `tool-event`, `client-tool-call-start`,
`client-tool-call-done`, and `client-tool-result` events through.

**Signature:**

```typescript
readonly events: AsyncIterable<IAiStreamEvent>;
```
