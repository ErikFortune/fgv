[Home](../../README.md) > [LibraryData](../README.md) > [CollectionFilter](./CollectionFilter.md) > filterDirectory

## CollectionFilter.filterDirectory() method

Filters a directory in a `FileTree` using this filter's configuration and optionally supplied parameters.

**Signature:**

```typescript
filterDirectory(dir: FileTreeItem, params?: IFilterDirectoryParams): Result<readonly IFilteredItem<IFileTreeFileItem<string>, T>[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dir</td><td>FileTreeItem</td><td>Directory to filter.</td></tr>
<tr><td>params</td><td>IFilterDirectoryParams</td><td>Optional filtering parameters.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IFilteredItem](../../interfaces/IFilteredItem.md)&lt;IFileTreeFileItem&lt;string&gt;, T&gt;[]&gt;


