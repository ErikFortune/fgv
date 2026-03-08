[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedBarTruffle](./ProducedBarTruffle.md) > scaleToYield

## ProducedBarTruffle.scaleToYield() method

Scales to a new bar truffle yield specification.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
scaleToYield(yieldSpec: IBufferedBarTruffleYield): Result<IBufferedBarTruffleYield>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>yieldSpec</td><td>IBufferedBarTruffleYield</td><td>Target yield specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBufferedBarTruffleYield](../../interfaces/IBufferedBarTruffleYield.md)&gt;

Success with updated yield, or failure
