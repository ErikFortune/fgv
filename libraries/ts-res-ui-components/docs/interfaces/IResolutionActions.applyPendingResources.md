[Home](../README.md) > [IResolutionActions](./IResolutionActions.md) > applyPendingResources

## IResolutionActions.applyPendingResources property

Apply all pending resource additions and deletions

**Signature:**

```typescript
applyPendingResources: () => Promise<Result<{ appliedCount: number; existingResourceEditCount: number; pendingResourceEditCount: number; newResourceCount: number; deletionCount: number }>>;
```
