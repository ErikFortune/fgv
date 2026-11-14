[Home](../README.md) > [InMemoryTreeAccessors](./InMemoryTreeAccessors.md) > cleanupAtomicTemporaries

## InMemoryTreeAccessors.cleanupAtomicTemporaries() method

Removes any working files this store reserves for interrupted atomic
writes from the given directory.

**Signature:**

```typescript
cleanupAtomicTemporaries(directory: string): Result<readonly string[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>directory</td><td>string</td><td>Absolute path of the directory to reclaim.</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly string[]&gt;

`Success` with an empty list, or `Failure` if the path is not an
existing directory.
