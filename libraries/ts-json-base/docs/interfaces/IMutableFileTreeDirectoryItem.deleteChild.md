[Home](../README.md) > [IMutableFileTreeDirectoryItem](./IMutableFileTreeDirectoryItem.md) > deleteChild

## IMutableFileTreeDirectoryItem.deleteChild() method

Deletes a child item from this directory.

**Signature:**

```typescript
deleteChild(name: string, options?: IDeleteChildOptions): Result<boolean>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The name of the child to delete.</td></tr>
<tr><td>options</td><td>IDeleteChildOptions</td><td>Optional FileTree.IDeleteChildOptions | options controlling deletion behavior.</td></tr>
</tbody></table>

**Returns:**

Result&lt;boolean&gt;

`Success` with `true` if the child was deleted, or `Failure` with an error message.
