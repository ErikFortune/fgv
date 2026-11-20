[Home](../README.md) > [AsyncDetailedResult](./AsyncDetailedResult.md) > onFailure

## AsyncDetailedResult.onFailure() method

Calls a supplied DetailedFailureContinuation | failure continuation if the wrapped
result is a failure.

**Signature:**

```typescript
onFailure(cb: DetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>DetailedFailureContinuation&lt;T, TD&gt;</td><td>The synchronous DetailedFailureContinuation | failure continuation to be
called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;T, TD&gt;

A new AsyncDetailedResult wrapping the continuation result.
