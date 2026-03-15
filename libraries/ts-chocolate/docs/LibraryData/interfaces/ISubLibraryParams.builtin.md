[Home](../../README.md) > [LibraryData](../README.md) > [ISubLibraryParams](./ISubLibraryParams.md) > builtin

## ISubLibraryParams.builtin property

Controls which built-in collections are loaded.
Built-in collections are always immutable.

- `true` (default): Load all built-in collections.
- `false`: Load no built-in collections.
- `SourceId[]`: Load only the specified built-in collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

**Signature:**

```typescript
readonly builtin: LibraryLoadSpec<CollectionId>;
```
