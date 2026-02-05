[Home](../README.md) > [ProducedConfectionBase](./ProducedConfectionBase.md) > scaleToYield

## ProducedConfectionBase.scaleToYield() method

Scales to a new yield specification.
Pushes current state to undo before change, clears redo.

Note: This method updates the yield in the confection data. Actual filling scaling
must be handled at a higher level (e.g., in sessions) where the filling library is accessible.

**Signature:**

```typescript
scaleToYield(yieldSpec: IConfectionYield): Result<IConfectionYield>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>yieldSpec</td><td>IConfectionYield</td><td>Target yield specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IConfectionYield](../interfaces/IConfectionYield.md)&gt;

Success with actual achieved yield, or failure
