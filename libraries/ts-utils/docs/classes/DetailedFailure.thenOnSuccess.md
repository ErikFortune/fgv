[Home](../README.md) > [DetailedFailure](./DetailedFailure.md) > thenOnSuccess

## DetailedFailure.thenOnSuccess() method

Propagates this failure's message **and detail** into an AsyncDetailedResult chain
without invoking the callback.

**Signature:**

```typescript
thenOnSuccess(__cb: AsyncDetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__cb</td><td>AsyncDetailedSuccessContinuation&lt;T, TD, TN&gt;</td><td>The AsyncDetailedSuccessContinuation | async success callback to be
called in case of success (ignored).</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;TN, TD&gt;

An AsyncDetailedResult | AsyncDetailedResult<TN, TD> carrying this failure's
message and detail.
