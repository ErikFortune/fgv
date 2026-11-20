[Home](../README.md) > [DetailedSuccess](./DetailedSuccess.md) > onFailure

## DetailedSuccess.onFailure() method

Propagates this DetailedSuccess.

**Signature:**

```typescript
onFailure(__cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__cb</td><td>DetailedFailureContinuation&lt;T, TD&gt;</td><td>DetailedFailureContinuation | Failure callback to be called
on a DetailedResult in case of failure (ignored).</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;T, TD&gt;

`this`
