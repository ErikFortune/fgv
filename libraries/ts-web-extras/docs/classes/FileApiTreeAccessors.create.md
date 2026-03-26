[Home](../README.md) > [FileApiTreeAccessors](./FileApiTreeAccessors.md) > create

## FileApiTreeAccessors.create() method

Create FileTree from various file sources using TreeInitializer array.

**Signature:**

```typescript
static create(initializers: TreeInitializer[], params?: IFileTreeInitParams<TCT>): Promise<Result<FileTree_2<TCT>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>initializers</td><td>TreeInitializer[]</td><td>Array of TreeInitializer objects specifying file sources</td></tr>
<tr><td>params</td><td>IFileTreeInitParams&lt;TCT&gt;</td><td>Optional `IFileTreeInitParams` for the file tree.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;FileTree_2&lt;TCT&gt;&gt;&gt;

Promise resolving to a FileTree with all content pre-loaded
