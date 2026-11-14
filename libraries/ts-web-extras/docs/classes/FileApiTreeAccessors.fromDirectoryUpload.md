[Home](../README.md) > [FileApiTreeAccessors](./FileApiTreeAccessors.md) > fromDirectoryUpload

## FileApiTreeAccessors.fromDirectoryUpload() method

Create FileTree from directory upload with webkitRelativePath.

**Signature:**

```typescript
static fromDirectoryUpload(fileList: FileList, params?: IFileTreeInitParams<TCT>): Promise<Result<FileTree_2<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fileList</td><td>FileList</td><td>FileList from a directory upload (input with webkitdirectory)</td></tr>
<tr><td>params</td><td>IFileTreeInitParams&lt;TCT&gt;</td><td>Optional `IFileTreeInitParams` for the file tree.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;FileTree_2&lt;TCT&gt;&gt;&gt;

Promise resolving to a FileTree with all content pre-loaded
