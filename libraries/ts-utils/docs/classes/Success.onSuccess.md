[Home](../README.md) > [Success](./Success.md) > onSuccess

## Success.onSuccess() method

Calls a supplied SuccessContinuation | success continuation if
the operation was a success.

**Signature:**

```typescript
onSuccess(cb: SuccessContinuation<T, TN>): Result<TN>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>SuccessContinuation&lt;T, TN&gt;</td><td>The SuccessContinuation | success continuation to
be called in the event of success.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;TN&gt;

If this operation was successful, returns the value returned
by the SuccessContinuation | success continuation.  If this result
failed, propagates the error message from this failure.
