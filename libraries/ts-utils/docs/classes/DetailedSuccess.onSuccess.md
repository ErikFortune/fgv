[Home](../README.md) > [DetailedSuccess](./DetailedSuccess.md) > onSuccess

## DetailedSuccess.onSuccess() method

Invokes the supplied DetailedSuccessContinuation | success callback and propagates
its returned DetailedResult | DetailedResult<TN, TD>.

**Signature:**

```typescript
onSuccess(cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>DetailedSuccessContinuation&lt;T, TD, TN&gt;</td><td>The DetailedSuccessContinuation | success callback to be invoked.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;TN, TD&gt;

The DetailedResult | DetailedResult<T, TD> returned by the success callback.
