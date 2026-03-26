[Home](../README.md) > [Qualifier](./Qualifier.md) > setIndex

## Qualifier.setIndex() method

Sets the index of this qualifier.  Once set, the index cannot be changed.

**Signature:**

```typescript
setIndex(index: QualifierIndex): Result<QualifierIndex>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>index</td><td>QualifierIndex</td><td>The index to set.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierIndex](../type-aliases/QualifierIndex.md)&gt;

`Success` with the index if successful, `Failure` with an error message otherwise.
