[Home](../../README.md) > [FileTree](../README.md) > [InMemoryTreeAccessors](./InMemoryTreeAccessors.md) > writeFileAtomically

## InMemoryTreeAccessors.writeFileAtomically() method

Replaces (or creates) a file's contents such that a reader never observes
a torn write.

**Signature:**

```typescript
writeFileAtomically(path: string, contents: string, options: IAtomicWriteOptions): DetailedResult<IAtomicWriteReceipt, IAtomicWriteFailure>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>Absolute path of the file to write.</td></tr>
<tr><td>contents</td><td>string</td><td>The string contents to write.</td></tr>
<tr><td>options</td><td>IAtomicWriteOptions</td><td>The requested FileTree.IAtomicWriteOptions | options.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[IAtomicWriteReceipt](../../interfaces/IAtomicWriteReceipt.md), [IAtomicWriteFailure](../../interfaces/IAtomicWriteFailure.md)&gt;

`DetailedSuccess` with the receipt if the write committed, or
`DetailedFailure` with a classified failure.
