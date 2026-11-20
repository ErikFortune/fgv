[Home](../README.md) > [AsyncDetailedResult](./AsyncDetailedResult.md) > onSuccess

## AsyncDetailedResult.onSuccess() method

Calls a supplied DetailedSuccessContinuation | success continuation if the wrapped
result is successful.

**Signature:**

```typescript
onSuccess(cb: DetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>DetailedSuccessContinuation&lt;T, TD, TN&gt;</td><td>The synchronous DetailedSuccessContinuation | success continuation to be
called in the event of success.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;TN, TD&gt;

A new AsyncDetailedResult wrapping the continuation result.
