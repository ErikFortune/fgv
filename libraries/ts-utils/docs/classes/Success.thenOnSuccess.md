[Home](../README.md) > [Success](./Success.md) > thenOnSuccess

## Success.thenOnSuccess() method

Calls a supplied AsyncSuccessContinuation | async success continuation if
the operation was a success, bridging into an AsyncResult chain.

**Signature:**

```typescript
thenOnSuccess(cb: AsyncSuccessContinuation<T, TN>): AsyncResult<TN>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>AsyncSuccessContinuation&lt;T, TN&gt;</td><td>The AsyncSuccessContinuation | async success continuation to
be called in the event of success.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;TN&gt;

An AsyncResult wrapping the async continuation result, or
propagating the error message from this failure.
