[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [EditingSessionValidator](./EditingSessionValidator.md) > scaleToTargetWeight

## EditingSessionValidator.scaleToTargetWeight() method

Scales the filling to achieve a target weight using a weakly-typed number.

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

Result&lt;[Measurement](../../../type-aliases/Measurement.md)&gt;

Success with actual achieved weight, or Failure
