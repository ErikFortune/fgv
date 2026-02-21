[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > createCollectionFile

## SubLibraryBase.createCollectionFile() method

Creates a file for a collection in the mutable data directory and
registers it as a source item for persistence.

**Signature:**

```typescript
createCollectionFile(collectionId: CollectionId, content: string, extension: "json" | "yaml"): Result<FileTreeItem>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
<tr><td>content</td><td>string</td><td>The file content to write</td></tr>
<tr><td>extension</td><td>"json" | "yaml"</td><td>File extension to use (default: 'yaml')</td></tr>
</tbody></table>

**Returns:**

Result&lt;FileTreeItem&gt;

Success with the created file item, or Failure if no writable directory or file creation fails
