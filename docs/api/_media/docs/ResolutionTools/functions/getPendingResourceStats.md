[Home](../../README.md) > [ResolutionTools](../README.md) > getPendingResourceStats

# Function: getPendingResourceStats

Gets statistics about pending resources.
Provides summary information useful for UI displays.

## Signature

```typescript
function getPendingResourceStats(pendingResources: Map<string, ILooseResourceDecl>): { totalCount: number; byType: Record<string, number>; resourceIds: string[] }
```
