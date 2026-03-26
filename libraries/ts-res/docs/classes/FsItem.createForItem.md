[Home](../README.md) > [FsItem](./FsItem.md) > createForItem

## FsItem.createForItem() method

Creates a new Import.FsItem | FsItem from a `FileTreeItem`.

**Signature:**

```typescript
static createForItem(item: FileTreeItem, qualifiers: IReadOnlyQualifierCollector): DetailedResult<FsItem, FsItemResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>item</td><td>FileTreeItem</td><td>The `FileTreeItem` to import.</td></tr>
<tr><td>qualifiers</td><td>IReadOnlyQualifierCollector</td><td>The Qualifiers.IReadOnlyQualifierCollector | qualifiers used to parse
embedded condition set tokens.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[FsItem](FsItem.md), [FsItemResultDetail](../type-aliases/FsItemResultDetail.md)&gt;

`Success` containing the new Import.FsItem | FsItem if successful, or a `Failure`
containing an error message if not.  Note that the result detail `skipped` indicates that the item
was not created because it is not relevant - this is a soft error that should be silently ignored.
