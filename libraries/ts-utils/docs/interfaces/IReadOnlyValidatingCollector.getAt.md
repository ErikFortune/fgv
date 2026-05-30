[Home](../README.md) > [IReadOnlyValidatingCollector](./IReadOnlyValidatingCollector.md) > getAt

## IReadOnlyValidatingCollector.getAt() method

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

[Result](../type-aliases/Result.md)&lt;TITEM&gt;

`Success` with the item if it exists, or `Failure` with an error if the index is out of range.
