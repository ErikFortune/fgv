[Home](../../README.md) > [AsyncControl](../README.md) > [WriteGate](./WriteGate.md) > pause

## WriteGate.pause() method

Holds every write that has not started, and waits — for at most `timeoutMs` — for the writes
under way to finish.

**Signature:**

```typescript
pause(timeoutMs: number): AsyncDetailedResult<IWriteGatePause, WriteGatePauseFailure>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>timeoutMs</td><td>number</td><td>The longest wait, an integer in `0 ≤ ms ≤ 2^31-1`; anything else is refused
(`'invalid'`) and nothing is paused.</td></tr>
</tbody></table>

**Returns:**

AsyncDetailedResult&lt;[IWriteGatePause](../../interfaces/IWriteGatePause.md), [WriteGatePauseFailure](../../type-aliases/WriteGatePauseFailure.md)&gt;

The held pause, to resume.
