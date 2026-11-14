[Home](../README.md) > [IStopConditions](./IStopConditions.md) > deadlineMs

## IStopConditions.deadlineMs property

Stop when this many milliseconds have passed. Absent means no deadline. Must be a finite
integer in `0 ≤ ms ≤ 2^31-1`, the range a platform timer honours; anything else is refused
up front and never scheduled.

**Signature:**

```typescript
readonly deadlineMs: number;
```
