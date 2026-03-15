[Home](../README.md) > [MaterializedLibrary](./MaterializedLibrary.md) > clearCache

## MaterializedLibrary.clearCache() method

Clears all cached materialized objects.

Call this after the underlying entity data has been mutated so that
subsequent `get()` calls re-materialize from the current entity state.

**Signature:**

```typescript
clearCache(): void;
```

**Returns:**

void
