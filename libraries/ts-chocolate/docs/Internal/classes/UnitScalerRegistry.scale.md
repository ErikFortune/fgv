[Home](../../README.md) > [Internal](../README.md) > [UnitScalerRegistry](./UnitScalerRegistry.md) > scale

## UnitScalerRegistry.scale() method

Scale an amount in the specified unit

**Signature:**

```typescript
scale(amount: Measurement, unit: MeasurementUnit, factor: number): Result<IScaledAmount>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>amount</td><td>Measurement</td><td>The amount to scale</td></tr>
<tr><td>unit</td><td>MeasurementUnit</td><td>The measurement unit</td></tr>
<tr><td>factor</td><td>number</td><td>The scaling factor</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IScaledAmount](../../interfaces/IScaledAmount.md)&gt;

The scaled amount with display information
