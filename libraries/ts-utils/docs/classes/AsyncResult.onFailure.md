[Home](../README.md) > [AsyncResult](./AsyncResult.md) > onFailure

## AsyncResult.onFailure() method

Calls a supplied FailureContinuation | failure continuation if
the wrapped result is a failure.

**Signature:**

```typescript
onFailure(cb: FailureContinuation<T>): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>FailureContinuation&lt;T&gt;</td><td>The synchronous FailureContinuation | failure continuation
to be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;T&gt;

A new AsyncResult wrapping the continuation result.
