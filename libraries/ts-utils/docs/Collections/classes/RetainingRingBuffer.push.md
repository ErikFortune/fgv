[Home](../../README.md) > [Collections](../README.md) > [RetainingRingBuffer](./RetainingRingBuffer.md) > push

## RetainingRingBuffer.push() method

Retains a record, evicting the oldest if the ring is full.

**Signature:**

```typescript
push(record: T): T;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>record</td><td>T</td><td>The record to retain. Its `seq` should be greater than the
`seq` of the previously-pushed record so cursor paging stays monotonic.</td></tr>
</tbody></table>

**Returns:**

T

The same record, for call-site chaining.
