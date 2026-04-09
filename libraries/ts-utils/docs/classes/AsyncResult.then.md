[Home](../README.md) > [AsyncResult](./AsyncResult.md) > then

## AsyncResult.then() method

Implementation of PromiseLike.then enabling `await` on AsyncResult.

**Signature:**

```typescript
then(onfulfilled?: ((value: Result<T>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>onfulfilled</td><td>((value: Result&lt;T&gt;) =&gt; TResult1 | PromiseLike&lt;TResult1&gt;) | null</td><td>Callback invoked when the promise resolves.</td></tr>
<tr><td>onrejected</td><td>((reason: unknown) =&gt; TResult2 | PromiseLike&lt;TResult2&gt;) | null</td><td>Callback invoked when the promise rejects.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;TResult1 | TResult2&gt;

A Promise resolving to the callback result.
