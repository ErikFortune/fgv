[Home](../README.md) > ResourceValueMergeMethod

# Type Alias: ResourceValueMergeMethod

Type representing the possible ways that a resource value can be merged into an existing resource.
- 'augment' means that the new value should be merged into the existing value, with new properties added and existing properties updated.
- 'delete' means that the existing values should be deleted.
- 'replace' means that the new value should replace the existing value.

## Type

```typescript
type ResourceValueMergeMethod = "augment" | "delete" | "replace"
```
