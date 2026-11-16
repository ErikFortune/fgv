[Home](../README.md) > [AsyncDetailedResult](./AsyncDetailedResult.md) > fromDetailed

## AsyncDetailedResult.fromDetailed() method

Creates an AsyncDetailedResult from a DetailedResult.

**Signature:**

```typescript
static fromDetailed(result: DetailedResult<T, TD>): AsyncDetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>result</td><td>DetailedResult&lt;T, TD&gt;</td><td>The DetailedResult to wrap.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;T, TD&gt;

A new AsyncDetailedResult wrapping the supplied result.
