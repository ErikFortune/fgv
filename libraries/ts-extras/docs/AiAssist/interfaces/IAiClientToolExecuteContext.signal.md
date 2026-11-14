[Home](../../README.md) > [AiAssist](../README.md) > [IAiClientToolExecuteContext](./IAiClientToolExecuteContext.md) > signal

## IAiClientToolExecuteContext.signal property

The turn's abort signal — `IExecuteClientToolTurnParams.signal`, when the caller supplied one.
A tool that does slow or side-effecting work (a network request, a subprocess) should pass it
on, so that a cancelled or timed-out turn stops the tool and not only the provider stream.

**Signature:**

```typescript
readonly signal: AbortSignal;
```
