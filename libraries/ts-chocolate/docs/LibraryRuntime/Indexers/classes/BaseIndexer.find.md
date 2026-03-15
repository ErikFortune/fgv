[Home](../../../README.md) > [LibraryRuntime](../../README.md) > [Indexers](../README.md) > [BaseIndexer](./BaseIndexer.md) > find

## BaseIndexer.find() method

Finds IDs matching the given configuration.

**Signature:**

```typescript
find(config: TConfig): Result<readonly TId[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>TConfig</td><td>The indexer-specific configuration</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly TId[]&gt;

Array of IDs, or Failure on error
