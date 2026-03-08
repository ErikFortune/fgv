[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > setFrames

## MoldedBonBonEditingSession.setFrames() method

Sets frames and buffer percentage for yield calculation.
Count is computed as: frames × cavitiesPerFrame

**Signature:**

```typescript
setFrames(numFrames: number, bufferPercentage: number): Result<IBufferedYieldInFrames>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>numFrames</td><td>number</td><td>Number of frames to produce</td></tr>
<tr><td>bufferPercentage</td><td>number</td><td>Buffer overfill (e.g., 10 for 10%)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IBufferedYieldInFrames](../../../interfaces/IBufferedYieldInFrames.md)&gt;

Success with computed yield, or Failure if invalid
