[Home](../README.md) > captureAsyncResult

# Function: captureAsyncResult

Wraps an async function which might throw to convert exception results
to Failure.

## Signature

```typescript
function captureAsyncResult(func: () => Promise<T>): AsyncResult<T>
```
