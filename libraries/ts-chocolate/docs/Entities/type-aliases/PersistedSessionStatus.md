[Home](../../README.md) > [Entities](../README.md) > PersistedSessionStatus

# Type Alias: PersistedSessionStatus

Persisted session lifecycle state.
- `planning`: Session is being planned but not actively editing
- `active`: Session is actively being edited
- `committing`: Session is in the process of being committed
- `committed`: Session has been committed to a journal entry
- `abandoned`: Session was explicitly abandoned

## Type

```typescript
type PersistedSessionStatus = "planning" | "active" | "committing" | "committed" | "abandoned"
```
