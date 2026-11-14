[Home](../../README.md) > [Collections](../README.md) > [IReadOnlyCollector](./IReadOnlyCollector.md) > getAt

## IReadOnlyCollector.getAt() method

Gets the item at a specified index.

**Signature:**

```typescript
getAt(index: number): Result<TITEM>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>index</td><td>number</td><td>The index of the item to retrieve.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;TITEM&gt;

Returns Success | Success with the item if it exists, or Failure | Failure
with an error if the index is out of range.
