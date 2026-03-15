[Home](../README.md) > [IEditingSessionValidator](./IEditingSessionValidator.md) > scaleToTargetWeight

## IEditingSessionValidator.scaleToTargetWeight() method

Scales the filling to achieve a target weight using a weakly-typed number.
Weight-contributing ingredients are scaled proportionally.

**Signature:**

```typescript
scaleToTargetWeight(targetWeight: number): Result<Measurement>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>targetWeight</td><td>number</td><td>Desired total weight (will be converted)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Measurement](../type-aliases/Measurement.md)&gt;

Success with actual achieved weight, or Failure
