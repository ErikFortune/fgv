[Home](../README.md) > [IIndexer](./IIndexer.md) > find

## IIndexer.find() method

Finds IDs matching the given configuration.
Returns undefined if this indexer has no work to do (config not relevant).
Returns empty array if config is relevant but no matches found.

**Signature:**

```typescript
find(config: TConfig): Result<readonly TId[]> | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>TConfig</td><td>The indexer-specific configuration</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly TId[]&gt; | undefined

Array of IDs, undefined if not applicable, or Failure on error
