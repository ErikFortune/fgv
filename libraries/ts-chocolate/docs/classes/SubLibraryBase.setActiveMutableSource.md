[Home](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > setActiveMutableSource

## SubLibraryBase.setActiveMutableSource() method

Sets the active mutable source for new collection creation.

Called by the UI layer when `defaultStorageTargets` is applied (on init or settings save)
to route new collections to the correct storage root.

**Signature:**

```typescript
setActiveMutableSource(sourceName: string, dataDirectory: IFileTreeDirectoryItem<string> | undefined, sourceRoot?: IFileTreeDirectoryItem<string>): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sourceName</td><td>string</td><td>The source name to stamp on new collections (matches `ICollectionRuntimeMetadata.sourceName`)</td></tr>
<tr><td>dataDirectory</td><td>IFileTreeDirectoryItem&lt;string&gt; | undefined</td><td>The directory where new collection files will be created</td></tr>
<tr><td>sourceRoot</td><td>IFileTreeDirectoryItem&lt;string&gt;</td><td></td></tr>
</tbody></table>

**Returns:**

void
