[Home](../../README.md) > [Helpers](../README.md) > generateUniqueBaseId

# Function: generateUniqueBaseId

Generate a unique base ID by appending a counter if needed.

## Signature

```typescript
function generateUniqueBaseId(baseId: string, existingIds: readonly string[] | ReadonlySet<string>, maxAttempts: number): Result<string>
```
