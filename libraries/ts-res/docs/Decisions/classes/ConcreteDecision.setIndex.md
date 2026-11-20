[Home](../../README.md) > [Decisions](../README.md) > [ConcreteDecision](./ConcreteDecision.md) > setIndex

## ConcreteDecision.setIndex() method

Sets the index for this decision.  Once set, index is immutable.

**Signature:**

```typescript
setIndex(index: number): Result<DecisionIndex>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>index</td><td>number</td><td>The index to set.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[DecisionIndex](../../type-aliases/DecisionIndex.md)&gt;

`Success` with the new index if successful, or `Failure` with an error message if not.
