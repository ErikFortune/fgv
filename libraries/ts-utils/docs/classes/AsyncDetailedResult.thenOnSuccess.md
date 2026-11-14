[Home](../README.md) > [AsyncDetailedResult](./AsyncDetailedResult.md) > thenOnSuccess

## AsyncDetailedResult.thenOnSuccess() method

Calls a supplied AsyncDetailedSuccessContinuation | async success continuation if the
wrapped result is successful.

**Signature:**

```typescript
thenOnSuccess(cb: AsyncDetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>AsyncDetailedSuccessContinuation&lt;T, TD, TN&gt;</td><td>The AsyncDetailedSuccessContinuation | async success continuation to be
called in the event of success.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;TN, TD&gt;

A new AsyncDetailedResult wrapping the async continuation result.
