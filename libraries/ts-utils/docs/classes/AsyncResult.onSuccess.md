[Home](../README.md) > [AsyncResult](./AsyncResult.md) > onSuccess

## AsyncResult.onSuccess() method

Calls a supplied SuccessContinuation | success continuation if
the wrapped result is successful.

**Signature:**

```typescript
onSuccess(cb: SuccessContinuation<T, TN>): AsyncResult<TN>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>SuccessContinuation&lt;T, TN&gt;</td><td>The synchronous SuccessContinuation | success continuation
to be called in the event of success.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;TN&gt;

A new AsyncResult wrapping the continuation result.
