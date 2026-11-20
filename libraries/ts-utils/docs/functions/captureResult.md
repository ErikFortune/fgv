[Home](../README.md) > captureResult

# Function: captureResult

Wraps a function which might throw to convert exception results
to Failure.

## Signature

```typescript
function captureResult(func: () => T): Result<T>
```
