[Home](../README.md) > validateAiCacheRequest

# Function: validateAiCacheRequest

Validates an IAiCacheRequest's `systemBreakpoints` against the `system` string they
index into. Thin wrapper over validateCacheBreakpoints for a caller that holds the
actual string (every `ts-extras` adapter) rather than just its length.

## Signature

```typescript
function validateAiCacheRequest(system: string, cache: IAiCacheRequest, maxBreakpointWrites: number): Result<IAiCacheRequest>
```
