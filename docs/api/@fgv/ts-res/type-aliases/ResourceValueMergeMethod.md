[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-res](../README.md) / ResourceValueMergeMethod

# Type Alias: ResourceValueMergeMethod

> **ResourceValueMergeMethod** = `"augment"` \| `"delete"` \| `"replace"`

Type representing the possible ways that a resource value can be merged into an existing resource.
- 'augment' means that the new value should be merged into the existing value, with new properties added and existing properties updated.
- 'delete' means that the existing values should be deleted.
- 'replace' means that the new value should replace the existing value.
