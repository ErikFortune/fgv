[Home](../README.md) > [Success](./Success.md) > onFailure

## Success.onFailure() method

Calls a supplied FailureContinuation | failed continuation if
the operation failed.

**Signature:**

```typescript
onFailure(__: FailureContinuation<T>): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__</td><td>FailureContinuation&lt;T&gt;</td><td>The FailureContinuation | failure continuation to
be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;T&gt;

If this operation failed, returns the value returned by the
FailureContinuation | failure continuation.  If this result
was successful, propagates the result value from the successful event.
