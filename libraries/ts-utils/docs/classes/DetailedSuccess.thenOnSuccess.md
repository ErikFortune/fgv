[Home](../README.md) > [DetailedSuccess](./DetailedSuccess.md) > thenOnSuccess

## DetailedSuccess.thenOnSuccess() method

Invokes the supplied AsyncDetailedSuccessContinuation | async success callback,
bridging into an AsyncDetailedResult chain which preserves the detail type.

**Signature:**

```typescript
thenOnSuccess(cb: AsyncDetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>AsyncDetailedSuccessContinuation&lt;T, TD, TN&gt;</td><td>The AsyncDetailedSuccessContinuation | async success callback to be invoked.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;TN, TD&gt;

An AsyncDetailedResult | AsyncDetailedResult<TN, TD> wrapping the callback's
result.
