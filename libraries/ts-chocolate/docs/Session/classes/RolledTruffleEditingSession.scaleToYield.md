[Home](../../README.md) > [Session](../README.md) > [RolledTruffleEditingSession](./RolledTruffleEditingSession.md) > scaleToYield

## RolledTruffleEditingSession.scaleToYield() method

Scales to new yield specification using linear count-based scaling.
All filling sessions scale proportionally by the count ratio.

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

Result&lt;[IConfectionYield](../../interfaces/IConfectionYield.md)&gt;

Success with updated yield, or Failure
