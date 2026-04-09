[Home](../README.md) > [AsyncResult](./AsyncResult.md) > thenOnFailure

## AsyncResult.thenOnFailure() method

Calls a supplied AsyncFailureContinuation | async failure continuation if
the wrapped result is a failure.

**Signature:**

```typescript
thenOnFailure(cb: AsyncFailureContinuation<T>): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>AsyncFailureContinuation&lt;T&gt;</td><td>The AsyncFailureContinuation | async failure continuation
to be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;T&gt;

A new AsyncResult wrapping the async continuation result.
