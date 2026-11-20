[Home](../README.md) > [Success](./Success.md) > thenOnFailure

## Success.thenOnFailure() method

Calls a supplied AsyncFailureContinuation | async failure continuation if
the operation failed, bridging into an AsyncResult chain.

**Signature:**

```typescript
thenOnFailure(__: AsyncFailureContinuation<T>): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__</td><td>AsyncFailureContinuation&lt;T&gt;</td><td>The AsyncFailureContinuation | async failure continuation to
be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;T&gt;

An AsyncResult wrapping the async continuation result, or
propagating the success value from this result.
