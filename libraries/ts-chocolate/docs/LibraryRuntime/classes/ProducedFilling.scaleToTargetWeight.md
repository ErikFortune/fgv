[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedFilling](./ProducedFilling.md) > scaleToTargetWeight

## ProducedFilling.scaleToTargetWeight() method

Scales all weight-contributing ingredients to achieve a target weight.
Non-weight-contributing ingredients (tsp, Tbsp, pinch, seeds, pods) remain unchanged.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
scaleToTargetWeight(targetWeight: Measurement): Result<Measurement>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>targetWeight</td><td>Measurement</td><td>Desired total weight</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Measurement](../../type-aliases/Measurement.md)&gt;

Success with actual achieved weight, or failure
