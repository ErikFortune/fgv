[Home](../README.md) > [AsyncDetailedResult](./AsyncDetailedResult.md) > thenOnFailure

## AsyncDetailedResult.thenOnFailure() method

Calls a supplied AsyncDetailedFailureContinuation | async failure continuation if the
wrapped result is a failure.

**Signature:**

```typescript
thenOnFailure(cb: AsyncDetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>AsyncDetailedFailureContinuation&lt;T, TD&gt;</td><td>The AsyncDetailedFailureContinuation | async failure continuation to be
called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;T, TD&gt;

A new AsyncDetailedResult wrapping the async continuation result.
