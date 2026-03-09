[Home](../../README.md) > [UserLibrary](../README.md) > [IUserLibrary](./IUserLibrary.md) > clearCache

## IUserLibrary.clearCache() method

Clears all cached MaterializedLibrary instances.
Call this after mutations to ensure subsequent reads re-materialize from current entity state.

**Signature:**

```typescript
clearCache(): void;
```

**Returns:**

void
