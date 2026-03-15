[Home](../../README.md) > [Internal](../README.md) > [UnitScalerRegistry](./UnitScalerRegistry.md) > getScaler

## UnitScalerRegistry.getScaler() method

Get the scaler for a specific unit

**Signature:**

```typescript
getScaler(unit: MeasurementUnit): IUnitScaler;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>unit</td><td>MeasurementUnit</td><td>The measurement unit</td></tr>
</tbody></table>

**Returns:**

[IUnitScaler](../../interfaces/IUnitScaler.md)

The appropriate scaler (falls back to linear scaler for unknown units)
