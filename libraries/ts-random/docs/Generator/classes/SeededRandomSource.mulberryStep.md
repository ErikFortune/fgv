[Home](../../README.md) > [Generator](../README.md) > [SeededRandomSource](./SeededRandomSource.md) > mulberryStep

## SeededRandomSource.mulberryStep() method

Steps a mulberry32 random number generator state and returns the next value.

**Signature:**

```typescript
static mulberryStep(currentState: number): INextResult;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>currentState</td><td>number</td><td>The current state of the generator.</td></tr>
</tbody></table>

**Returns:**

[INextResult](../../interfaces/INextResult.md)

The next random number and the next state.
