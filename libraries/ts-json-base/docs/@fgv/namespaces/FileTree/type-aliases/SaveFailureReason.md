[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / SaveFailureReason

# Type Alias: SaveFailureReason

> **SaveFailureReason** = `"not-supported"` \| `"read-only"` \| `"not-mutable"` \| `"path-excluded"` \| `"permission-denied"`

Indicates the reason a save operation cannot be performed.
- `not-supported`: The accessors do not support mutation.
- `read-only`: The file or file system is read-only.
- `not-mutable`: Mutability is disabled in configuration.
- `path-excluded`: The path is excluded by the mutability filter.
- `permission-denied`: Insufficient permissions to write.
