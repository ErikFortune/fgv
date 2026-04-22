[Home](../README.md) > hasPendingContextChanges

# Function: hasPendingContextChanges

Check if context has any pending changes by comparing current and pending values.

Performs a deep comparison between current context values and pending context values
to determine if there are unsaved changes. This is useful for UI state management
and preventing data loss in resolution interfaces.

## Signature

```typescript
function hasPendingContextChanges(contextValues: Record<string, string | undefined>, pendingContextValues: Record<string, string | undefined>): boolean
```
