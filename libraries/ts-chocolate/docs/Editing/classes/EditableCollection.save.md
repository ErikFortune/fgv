[Home](../../README.md) > [Editing](../README.md) > [EditableCollection](./EditableCollection.md) > save

## EditableCollection.save() method

Save the collection to its source file using FileTree persistence.
Requires a sourceItem with a mutable FileTree.

When the collection's metadata includes a `secretName` and a KeyStore
is available (via constructor or options), the collection is encrypted
before writing. Otherwise it is saved as plain YAML.

**Signature:**

```typescript
save(options?: ICollectionSaveOptions): Promise<Result<true>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ICollectionSaveOptions</td><td>Optional save options (e.g. KeyStore override)</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;true&gt;&gt;

Result with `true` on success, or Failure with error context
