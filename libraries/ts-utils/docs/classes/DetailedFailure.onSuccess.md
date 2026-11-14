[Home](../README.md) > [DetailedFailure](./DetailedFailure.md) > onSuccess

## DetailedFailure.onSuccess() method

Propagates the error message and detail from this result.

**Signature:**

```typescript
onSuccess(__cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__cb</td><td>DetailedSuccessContinuation&lt;T, TD, TN&gt;</td><td>DetailedSuccessContinuation | Success callback to be called
on a DetailedResult in case of success (ignored).</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TN, TD&gt;

A new DetailedFailure | DetailedFailure<TN, TD> which contains
the error message and detail from this one.
