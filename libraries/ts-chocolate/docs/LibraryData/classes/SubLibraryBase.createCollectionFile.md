[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > createCollectionFile

## SubLibraryBase.createCollectionFile() method

Creates a YAML file for a collection in the mutable data directory and
registers it as a source item for persistence.

**Signature:**

```typescript
createCollectionFile(collectionId: CollectionId, yamlContent: string): Result<FileTreeItem>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
<tr><td>yamlContent</td><td>string</td><td>The YAML content to write</td></tr>
</tbody></table>

**Returns:**

Result&lt;FileTreeItem&gt;

Success with the created file item, or Failure if no writable directory or file creation fails
