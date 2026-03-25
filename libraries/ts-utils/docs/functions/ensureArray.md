[Home](../README.md) > ensureArray

# Function: ensureArray

Ensures the input is an array. If already an array, returns it as-is.
If a single item, wraps it in an array.
Preserves readonly status of input arrays.

## Signature

```typescript
function ensureArray(items: T): EnsureArrayResult<T>
```
