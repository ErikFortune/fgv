[Home](../README.md) > [DetailedFailure](./DetailedFailure.md) > onFailure

## DetailedFailure.onFailure() method

Invokes the supplied DetailedFailureContinuation | failure callback and propagates
its returned DetailedResult | DetailedResult<T, TD>.

**Signature:**

```typescript
onFailure(cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>DetailedFailureContinuation&lt;T, TD&gt;</td><td>The DetailedFailureContinuation | failure callback to be invoked.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;T, TD&gt;

The DetailedResult | DetailedResult<T, TD> returned by the failure callback.
