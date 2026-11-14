[Home](../README.md) > validateCacheBreakpoints

# Function: validateCacheBreakpoints

Validates an IAiCacheRequest's `systemBreakpoints` against the length of the `system`
string they index into, and optionally against a per-model write cap.

## Signature

```typescript
function validateCacheBreakpoints(systemLength: number, cache: IAiCacheRequest, maxBreakpointWrites: number): Result<IAiCacheRequest>
```
