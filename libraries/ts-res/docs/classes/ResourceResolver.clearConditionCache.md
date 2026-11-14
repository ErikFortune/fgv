[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > clearConditionCache

## ResourceResolver.clearConditionCache() method

Clears all caches (condition, condition set, and decision), forcing all cached items
to be re-evaluated on next access. This should be called when the context changes and cached
results are no longer valid.

**Signature:**

```typescript
clearConditionCache(): void;
```

**Returns:**

void
