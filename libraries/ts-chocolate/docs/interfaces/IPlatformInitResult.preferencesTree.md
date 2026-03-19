[Home](../README.md) > [IPlatformInitResult](./IPlatformInitResult.md) > preferencesTree

## IPlatformInitResult.preferencesTree property

Cloud tree to use for preferences read/write, when preferencesLocation is external.
When set, SettingsManager loads and saves preferences from/to this tree instead of
the local userLibraryTree.

**Signature:**

```typescript
readonly preferencesTree: IFileTreeDirectoryItem<string>;
```
