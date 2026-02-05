[Home](../README.md) > [IFindOrchestrator](./IFindOrchestrator.md) > find

## IFindOrchestrator.find() method

Finds entities matching a query specification.

**Signature:**

```typescript
find(spec: TSpec, options?: IFindOptions): Result<readonly TEntity[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>TSpec</td><td>Query specification</td></tr>
<tr><td>options</td><td>IFindOptions</td><td>Optional find options (aggregation mode)</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly TEntity[]&gt;

Array of matching entities
