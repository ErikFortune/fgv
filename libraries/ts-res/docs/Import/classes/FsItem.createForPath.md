[Home](../../README.md) > [Import](../README.md) > [FsItem](./FsItem.md) > createForPath

## FsItem.createForPath() method

Creates a new Import.FsItem | FsItem from a file system path.

**Signature:**

```typescript
static createForPath(importPath: string, qualifiers: IReadOnlyQualifierCollector, tree?: FileTree_2<string>): DetailedResult<FsItem, FsItemResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>importPath</td><td>string</td><td>The path to the file system item to import.</td></tr>
<tr><td>qualifiers</td><td>IReadOnlyQualifierCollector</td><td>The Qualifiers.IReadOnlyQualifierCollector | qualifiers used to parse
embedded condition set tokens.</td></tr>
<tr><td>tree</td><td>FileTree_2&lt;string&gt;</td><td>An optional FileTree.FileTree | file tree to use for this item.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[FsItem](../../classes/FsItem.md), [FsItemResultDetail](../../type-aliases/FsItemResultDetail.md)&gt;

`Success` containing the new Import.FsItem | FsItem if an item is created
successfully, or a `Failure` containing an error message if it is not.  Note that the result detail
`skipped` indicates that the item was not created because it is not relevant - this is a soft error
that should be silently ignored.
