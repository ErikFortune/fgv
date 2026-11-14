[Home](../../README.md) > [FileTree](../README.md) > [DirectoryItem](./DirectoryItem.md) > writeChildAtomically

## DirectoryItem.writeChildAtomically() method

Atomically writes (creating or replacing) a child file of this
directory, such that a reader never observes a torn write.

**Signature:**

```typescript
writeChildAtomically(name: string, contents: string, options: IAtomicWriteOptions): DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>The file name to write, relative to this directory. Must
be a single valid child name — no path separators.</td></tr>
<tr><td>contents</td><td>string</td><td>The string contents to write.</td></tr>
<tr><td>options</td><td>IAtomicWriteOptions</td><td>The requested FileTree.IAtomicWriteOptions | options.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[IAtomicWriteReceipt](../../interfaces/IAtomicWriteReceipt.md), [IAtomicWriteFailure](../../interfaces/IAtomicWriteFailure.md)&gt;

`DetailedSuccess` with the FileTree.IAtomicWriteReceipt | receipt if the write committed, or `DetailedFailure` with a classified
FileTree.IAtomicWriteFailure | failure.
