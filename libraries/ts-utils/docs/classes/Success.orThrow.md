[Home](../README.md) > [Success](./Success.md) > orThrow

## Success.orThrow() method

Gets the value associated with a successful IResult | result,
or throws the error message if the corresponding operation failed.

**Signature:**

```typescript
orThrow(logger?: IResultLogger<unknown>): T;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>logger</td><td>IResultLogger&lt;unknown&gt;</td><td>An optional IResultLogger | logger to which the
error will also be reported.</td></tr>
</tbody></table>

**Returns:**

T

The return value, if the operation was successful.
