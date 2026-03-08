[Home](../../README.md) > [Session](../README.md) > [BarTruffleEditingSession](./BarTruffleEditingSession.md) > scaleToYield

## BarTruffleEditingSession.scaleToYield() method

Scales to new yield specification using linear count-based scaling.
All filling sessions scale proportionally by the count ratio.

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
