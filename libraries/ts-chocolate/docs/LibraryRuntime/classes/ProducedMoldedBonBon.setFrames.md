[Home](../../README.md) > [LibraryRuntime](../README.md) > [ProducedMoldedBonBon](./ProducedMoldedBonBon.md) > setFrames

## ProducedMoldedBonBon.setFrames() method

Sets the frame count and buffer percentage for this molded bonbon.
Pushes current state to undo before change, clears redo.

**Signature:**

```typescript
setFrames(numFrames: number, bufferPercentage: Percentage): Result<IBufferedYieldInFrames>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>numFrames</td><td>number</td><td>Number of frames to produce</td></tr>
<tr><td>bufferPercentage</td><td>Percentage</td><td>Buffer percentage (e.g., 10 for 10%)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBufferedYieldInFrames](../../interfaces/IBufferedYieldInFrames.md)&gt;

Success with updated yield, or failure
