[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > conditionSetCache

## ResourceResolver.conditionSetCache property

The cache array for resolved condition sets, indexed by condition set index for O(1) lookup.
Each entry stores the resolved ConditionSetResolutionResult for the corresponding condition set.

**Signature:**

```typescript
readonly conditionSetCache: readonly (ConditionSetResolutionResult | undefined)[];
```
