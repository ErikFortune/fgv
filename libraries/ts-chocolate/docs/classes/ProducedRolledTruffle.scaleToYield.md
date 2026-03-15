[Home](../README.md) > [ProducedRolledTruffle](./ProducedRolledTruffle.md) > scaleToYield

## ProducedRolledTruffle.scaleToYield() method

Scales to a new rolled truffle yield specification.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
scaleToYield(yieldSpec: IBufferedYieldInPieces): Result<IBufferedYieldInPieces>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>yieldSpec</td><td>IBufferedYieldInPieces</td><td>Target yield specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBufferedYieldInPieces](../interfaces/IBufferedYieldInPieces.md)&gt;

Success with updated yield, or failure
