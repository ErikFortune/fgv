[Home](../README.md) > [IRestoreOptions](./IRestoreOptions.md) > pathPrefixes

## IRestoreOptions.pathPrefixes property

Optional set of path prefixes. When provided, only files whose relative
path starts with at least one prefix are restored. Supports both exact
file paths (e.g. `data/ingredients/my-collection.yaml`) and directory
prefixes (e.g. `data/settings/`).

If omitted or empty, all files are restored.

**Signature:**

```typescript
readonly pathPrefixes: ReadonlySet<string>;
```
