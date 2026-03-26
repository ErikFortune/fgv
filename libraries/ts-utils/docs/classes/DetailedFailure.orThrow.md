[Home](../README.md) > [DetailedFailure](./DetailedFailure.md) > orThrow

## DetailedFailure.orThrow() method

Gets the value associated with a successful IResult | result,
or throws the error message if the corresponding operation failed.

**Signature:**

```typescript
orThrow(logOrFormat?: ErrorFormatter<TD> | IResultLogger<TD>): never;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>logOrFormat</td><td>ErrorFormatter&lt;TD&gt; | IResultLogger&lt;TD&gt;</td><td>An optional IResultLogger | logger to which the
error will also be reported.</td></tr>
</tbody></table>

**Returns:**

never

The return value, if the operation was successful.
