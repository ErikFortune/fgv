[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > conditionCache

## ResourceResolver.conditionCache property

The cache array for resolved conditions, indexed by condition index for O(1) lookup.
Each entry stores the resolved Runtime.IConditionMatchResult | condition match result for
the corresponding condition.

**Signature:**

```typescript
readonly conditionCache: readonly (IConditionMatchResult | undefined)[];
```
