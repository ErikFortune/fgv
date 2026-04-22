[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json](../../../README.md) / [Diff](../README.md) / DiffChangeType

# Type Alias: DiffChangeType

> **DiffChangeType** = `"added"` \| `"removed"` \| `"modified"` \| `"unchanged"`

Type of change detected in a JSON diff operation.

- `'added'` - Property exists only in the second object
- `'removed'` - Property exists only in the first object
- `'modified'` - Property exists in both objects but with different values
- `'unchanged'` - Property exists in both objects with identical values (only included when `includeUnchanged` is true)
