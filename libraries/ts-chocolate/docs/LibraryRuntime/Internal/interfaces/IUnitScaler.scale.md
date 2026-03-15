[Home](../../../README.md) > [LibraryRuntime](../../README.md) > [Internal](../README.md) > [IUnitScaler](./IUnitScaler.md) > scale

## IUnitScaler.scale() method

Scale an amount by a factor

**Signature:**

```typescript
scale(amount: Measurement, factor: number): Result<IScaledAmount>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>amount</td><td>Measurement</td><td>The original amount</td></tr>
<tr><td>factor</td><td>number</td><td>The scaling factor</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IScaledAmount](../../../interfaces/IScaledAmount.md)&gt;

Scaled amount with display information
