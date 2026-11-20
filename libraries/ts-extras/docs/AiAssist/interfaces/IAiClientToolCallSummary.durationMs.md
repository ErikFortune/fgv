[Home](../../README.md) > [AiAssist](../README.md) > [IAiClientToolCallSummary](./IAiClientToolCallSummary.md) > durationMs

## IAiClientToolCallSummary.durationMs property

How long deciding and running this call took, in milliseconds on the turn's clock
(`IExecuteClientToolTurnParams.clock`): from the moment its arguments were complete to the
moment its result was ready, covering argument validation, the `onBeforeToolExecute` gate and
`execute`.

**Signature:**

```typescript
readonly durationMs: number;
```
