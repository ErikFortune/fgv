[Home](../../README.md) > [AsyncControl](../README.md) > StopReason

# Type Alias: StopReason

The two `StopDetail` values that mean a stop condition fired, rather than the work failing.

## Type

```typescript
type StopReason = Exclude<StopDetail, "failed">
```
