[Home](../../README.md) > [LibraryData](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > loadFromFileTreeSource

## SubLibraryBase.loadFromFileTreeSource() method

Loads collections from a file tree source and adds them to this library.

**Signature:**

```typescript
loadFromFileTreeSource(source: SubLibraryFileTreeSource): Result<number>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>source</td><td>SubLibraryFileTreeSource</td><td>The file tree source to load from</td></tr>
</tbody></table>

**Returns:**

Result&lt;number&gt;

Success with the number of collections added, or Failure with error message
