[Home](../../README.md) > [UserLibrary](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > scaleToYield

## MoldedBonBonEditingSession.scaleToYield() method

Scales to new yield specification.
Handles both frame-based and legacy count-based yield.

**Signature:**

```typescript
scaleToYield(yieldSpec: BufferedConfectionYield): Result<BufferedConfectionYield>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>yieldSpec</td><td>BufferedConfectionYield</td><td>The new yield specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BufferedConfectionYield](../../type-aliases/BufferedConfectionYield.md)&gt;

Success with updated yield, or Failure
