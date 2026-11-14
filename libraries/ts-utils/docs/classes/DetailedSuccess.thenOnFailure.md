[Home](../README.md) > [DetailedSuccess](./DetailedSuccess.md) > thenOnFailure

## DetailedSuccess.thenOnFailure() method

Propagates this DetailedSuccess into an AsyncDetailedResult chain without
invoking the callback.

**Signature:**

```typescript
thenOnFailure(__cb: AsyncDetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__cb</td><td>AsyncDetailedFailureContinuation&lt;T, TD&gt;</td><td>The AsyncDetailedFailureContinuation | async failure callback to be
called in case of failure (ignored).</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;T, TD&gt;

An AsyncDetailedResult | AsyncDetailedResult<T, TD> wrapping `this`.
