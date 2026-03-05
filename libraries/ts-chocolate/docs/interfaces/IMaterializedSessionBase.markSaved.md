[Home](../README.md) > [IMaterializedSessionBase](./IMaterializedSessionBase.md) > markSaved

## IMaterializedSessionBase.markSaved() method

Resets the change-detection baseline to the current produced state.
Call after a successful save so that `hasChanges` returns false
until the next mutation.

**Signature:**

```typescript
markSaved(): void;
```

**Returns:**

void
