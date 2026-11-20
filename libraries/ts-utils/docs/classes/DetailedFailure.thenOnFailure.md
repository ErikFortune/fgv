[Home](../README.md) > [DetailedFailure](./DetailedFailure.md) > thenOnFailure

## DetailedFailure.thenOnFailure() method

Invokes the supplied AsyncDetailedFailureContinuation | async failure callback,
bridging into an AsyncDetailedResult chain which preserves the detail type.

**Signature:**

```typescript
thenOnFailure(cb: AsyncDetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>AsyncDetailedFailureContinuation&lt;T, TD&gt;</td><td>The AsyncDetailedFailureContinuation | async failure callback to be invoked.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;T, TD&gt;

An AsyncDetailedResult | AsyncDetailedResult<T, TD> wrapping the callback's
result.
