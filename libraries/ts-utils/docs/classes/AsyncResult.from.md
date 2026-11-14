[Home](../README.md) > [AsyncResult](./AsyncResult.md) > from

## AsyncResult.from() method

Creates an AsyncResult from a Result.

**Signature:**

```typescript
static from(result: Result<T>): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>result</td><td>Result&lt;T&gt;</td><td>The Result to wrap.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;T&gt;

A new AsyncResult wrapping the supplied result.
