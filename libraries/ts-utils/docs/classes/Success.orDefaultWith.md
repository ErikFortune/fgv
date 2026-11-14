[Home](../README.md) > [Success](./Success.md) > orDefaultWith

## Success.orDefaultWith() method

Gets the value associated with a successful IResult | result, or a
default produced by the supplied callback if the corresponding operation
failed.

**Signature:**

```typescript
orDefaultWith(cb: () => T): T;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>() =&gt; T</td><td>Produces the default. Invoked only when the operation failed.</td></tr>
</tbody></table>

**Returns:**

T

The result value if the operation succeeded, otherwise the value
returned by `cb`.
