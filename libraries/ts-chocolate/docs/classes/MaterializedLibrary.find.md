[Home](../README.md) > [MaterializedLibrary](./MaterializedLibrary.md) > find

## MaterializedLibrary.find() method

Finds materialized objects matching a query specification.

**Signature:**

```typescript
find(spec: TQuerySpec, options?: IFindOptions): Result<readonly TMaterialized[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>TQuerySpec</td><td>Query specification</td></tr>
<tr><td>options</td><td>IFindOptions</td><td>Optional find options (aggregation mode)</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly TMaterialized[]&gt;

Array of matching materialized objects
