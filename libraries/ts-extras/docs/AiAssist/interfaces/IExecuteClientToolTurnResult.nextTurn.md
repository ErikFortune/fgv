[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnResult](./IExecuteClientToolTurnResult.md) > nextTurn

## IExecuteClientToolTurnResult.nextTurn property

Resolves when the stream terminates. On success, carries the
AiAssist.IAiClientToolTurnResult with the optional continuation for the
next round. On failure, carries the error message.

**Signature:**

```typescript
readonly nextTurn: Promise<Result<IAiClientToolTurnResult>>;
```
