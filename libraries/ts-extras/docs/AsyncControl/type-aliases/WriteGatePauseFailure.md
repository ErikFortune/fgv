[Home](../../README.md) > [AsyncControl](../README.md) > WriteGatePauseFailure

# Type Alias: WriteGatePauseFailure

Why a `WriteGate.pause` failed, leaving nothing paused:
- `'timeout'` — writes under way did not finish in time, and none was waiting on the pause.
- `'stalled'` — writes under way did not finish in time **while writes were waiting on the
  pause**. That is the shape of a guarded write that is itself waiting on a guarded write — the
  reentrant deadlock the call-site rule on `WriteGate` forbids — though a
  merely slow write with unrelated callers queued behind it looks the same.
- `'invalid'` — `timeoutMs` was out of range, or the timer could not be armed. Nothing was paused.

## Type

```typescript
type WriteGatePauseFailure = "timeout" | "stalled" | "invalid"
```
