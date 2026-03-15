[Home](../../README.md) > [Helpers](../README.md) > generateUniqueBaseIdFromName

# Function: generateUniqueBaseIdFromName

Generate a unique base ID from a name.
Combines nameToBaseId and generateUniqueBaseId.

## Signature

```typescript
function generateUniqueBaseIdFromName(name: string, existingIds: readonly string[] | ReadonlySet<string>, maxAttempts: number): Result<string>
```
