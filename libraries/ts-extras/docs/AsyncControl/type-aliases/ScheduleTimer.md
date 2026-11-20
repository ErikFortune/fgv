[Home](../../README.md) > [AsyncControl](../README.md) > ScheduleTimer

# Type Alias: ScheduleTimer

Starts a one-shot timer that calls `fn` after `ms` milliseconds and returns its cancel function:
the seam a deadline is armed through, so a test can fire it deterministically.

## Type

```typescript
type ScheduleTimer = (fn: () => void, ms: number) => CancelTimer
```
