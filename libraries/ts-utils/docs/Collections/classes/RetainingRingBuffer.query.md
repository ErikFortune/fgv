[Home](../../README.md) > [Collections](../README.md) > [RetainingRingBuffer](./RetainingRingBuffer.md) > query

## RetainingRingBuffer.query() method

Returns retained records, oldest-first, optionally filtered and paged.

**Signature:**

```typescript
query(query?: IRetainingRingBufferQuery<T>): readonly T[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>query</td><td>IRetainingRingBufferQuery&lt;T&gt;</td><td>IRetainingRingBufferQuery | Filtering and paging options.</td></tr>
</tbody></table>

**Returns:**

readonly T[]

The matching records, oldest-first.
