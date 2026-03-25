[Home](../../README.md) > [Diff](../README.md) > DiffChangeType

# Type Alias: DiffChangeType

Type of change detected in a JSON diff operation.

- `'added'` - Property exists only in the second object
- `'removed'` - Property exists only in the first object
- `'modified'` - Property exists in both objects but with different values
- `'unchanged'` - Property exists in both objects with identical values (only included when `includeUnchanged` is true)

## Type

```typescript
type DiffChangeType = "added" | "removed" | "modified" | "unchanged"
```
