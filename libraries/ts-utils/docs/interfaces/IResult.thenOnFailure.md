[Home](../README.md) > [IResult](./IResult.md) > thenOnFailure

## IResult.thenOnFailure() method

Calls a supplied AsyncFailureContinuation | async failure continuation if
the operation failed, bridging into an AsyncResult chain.

**Signature:**

```typescript
thenOnFailure(cb: AsyncFailureContinuation<T>): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>AsyncFailureContinuation&lt;T&gt;</td><td>The AsyncFailureContinuation | async failure continuation to
be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](../classes/AsyncResult.md)&lt;T&gt;

An AsyncResult wrapping the async continuation result, or
propagating the success value from this result.
