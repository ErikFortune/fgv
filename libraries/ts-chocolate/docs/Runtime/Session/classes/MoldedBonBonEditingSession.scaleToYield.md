[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > scaleToYield

## MoldedBonBonEditingSession.scaleToYield() method

Scales to new yield specification.
Handles both frame-based and legacy count-based yield.

**Signature:**

```typescript
scaleToYield(yieldSpec: AnyConfectionYield): Result<IConfectionYield>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>yieldSpec</td><td>AnyConfectionYield</td><td>The new yield specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IConfectionYield](../../../interfaces/IConfectionYield.md)&gt;

Success with updated yield, or Failure
