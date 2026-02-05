[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > setFrames

## MoldedBonBonEditingSession.setFrames() method

Sets frames and buffer percentage for yield calculation.
Count is computed as: frames × cavitiesPerFrame

**Signature:**

```typescript
setFrames(frames: number, bufferPercentage: number): Result<IMoldedBonBonYield>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>frames</td><td>number</td><td>Number of frames to produce</td></tr>
<tr><td>bufferPercentage</td><td>number</td><td>Buffer overfill (e.g., 0.1 for 10%)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMoldedBonBonYield](../../../interfaces/IMoldedBonBonYield.md)&gt;

Success with computed yield, or Failure if invalid
