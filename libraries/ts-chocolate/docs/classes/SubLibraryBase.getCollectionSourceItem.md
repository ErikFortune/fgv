[Home](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > getCollectionSourceItem

## SubLibraryBase.getCollectionSourceItem() method

Get the FileTree source item for a collection, if available.

Returns the FileTree item that was used to load this collection.
This can be passed to EditableCollection to enable direct save() functionality.
Only available for collections loaded from FileTree sources.

**Signature:**

```typescript
getCollectionSourceItem(collectionId: CollectionId): FileTreeItem | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>ID of the collection</td></tr>
</tbody></table>

**Returns:**

FileTreeItem | undefined

The FileTree source item, or undefined if not available
