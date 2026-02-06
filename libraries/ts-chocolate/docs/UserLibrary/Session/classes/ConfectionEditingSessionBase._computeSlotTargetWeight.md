[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [ConfectionEditingSessionBase](./ConfectionEditingSessionBase.md) > _computeSlotTargetWeight

## ConfectionEditingSessionBase._computeSlotTargetWeight() method

Computes target weight for a specific filling slot based on current yield.
Implementation is type-specific:
- Molded bonbons: Equal division of total cavity weight
- Bar/rolled truffles: Preserve current session weight (linear scaling)

**Signature:**

```typescript
_computeSlotTargetWeight(slotId: SlotId): Result<Measurement>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>slotId</td><td>SlotId</td><td>The slot identifier</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Measurement](../../../type-aliases/Measurement.md)&gt;

Success with target weight, or Failure
