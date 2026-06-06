[Home](../../README.md) > [ResolutionTools](../README.md) > validatePendingResourceKeys

# Function: validatePendingResourceKeys

Validates that all keys in a pending resources map are properly formatted as full resource IDs.
This is a diagnostic function to ensure the pending resource key invariant is maintained.

## Signature

```typescript
function validatePendingResourceKeys(pendingResources: Map<string, ILooseResourceDecl<string>>): Result<void>
```
