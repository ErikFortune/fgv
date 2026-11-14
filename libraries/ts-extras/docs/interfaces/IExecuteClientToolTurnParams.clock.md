[Home](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > clock

## IExecuteClientToolTurnParams.clock property

Monotonic clock in milliseconds that each call's `IAiClientToolCallSummary.durationMs` is
measured with. Defaults to
`performance.now`; inject one to make timing deterministic in tests.

**Signature:**

```typescript
readonly clock: () => number;
```
