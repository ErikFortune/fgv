[Home](../../README.md) > [AsyncControl](../README.md) > CancelTimer

# Type Alias: CancelTimer

Cancels a timer started by a `ScheduleTimer`. Must be safe to call more than
once, and after the timer has fired.

## Type

```typescript
type CancelTimer = () => void
```
