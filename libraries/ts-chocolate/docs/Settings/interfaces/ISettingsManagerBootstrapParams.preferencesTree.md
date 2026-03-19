[Home](../../README.md) > [Settings](../README.md) > [ISettingsManagerBootstrapParams](./ISettingsManagerBootstrapParams.md) > preferencesTree

## ISettingsManagerBootstrapParams.preferencesTree property

Optional alternate file tree for preferences (e.g. a cloud root).
When provided, preferences are read from and written to this tree
instead of `fileTree`. Bootstrap settings always stay in `fileTree`.

**Signature:**

```typescript
readonly preferencesTree: IFileTreeDirectoryItem<string>;
```
