[Home](../README.md) > [ConditionSet](./ConditionSet.md) > setIndex

## ConditionSet.setIndex() method

Sets the global index for this condition set.  Once set, the index cannot be changed.

**Signature:**

```typescript
setIndex(index: number): Result<ConditionSetIndex>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>index</td><td>number</td><td>The index to set for this condition set.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSetIndex](../type-aliases/ConditionSetIndex.md)&gt;

`Success` with the index if successful, `Failure` otherwise.
