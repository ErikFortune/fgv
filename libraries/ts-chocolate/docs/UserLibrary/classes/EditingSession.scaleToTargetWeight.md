[Home](../../README.md) > [UserLibrary](../README.md) > [EditingSession](./EditingSession.md) > scaleToTargetWeight

## EditingSession.scaleToTargetWeight() method

Scales the filling to achieve a target weight.
Weight-contributing ingredients (g, mL) are scaled proportionally.
Non-weight ingredients (tsp, Tbsp, pinch, etc.) remain unchanged.

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
