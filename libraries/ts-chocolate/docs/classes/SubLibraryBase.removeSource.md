[Home](../README.md) > [SubLibraryBase](./SubLibraryBase.md) > removeSource

## SubLibraryBase.removeSource() method

Remove all mutable collections whose metadata `sourceName` matches the given source.
Used to unload a storage root (e.g., a local directory) from the library at runtime.

**Signature:**

```typescript
removeSource(sourceName: string): number;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sourceName</td><td>string</td><td>The source name to remove (matches `ICollectionRuntimeMetadata.sourceName`)</td></tr>
</tbody></table>

**Returns:**

number

The number of collections removed
