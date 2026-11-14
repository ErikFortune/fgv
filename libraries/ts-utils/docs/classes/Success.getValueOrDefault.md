[Home](../README.md) > [Success](./Success.md) > getValueOrDefault

## Success.getValueOrDefault() method

Gets the value associated with a successful IResult | result,
or a default value if the corresponding operation failed.

**Signature:**

```typescript
getValueOrDefault(dflt?: T): T | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dflt</td><td>T</td><td>The value to be returned if the operation failed (default is
`undefined`).

Note that `getValueOrDefault` is being superseded by `orDefault` and
will eventually be deprecated.  Please use orDefault instead.</td></tr>
</tbody></table>

**Returns:**

T | undefined

The return value, if the operation was successful.  Returns
the supplied default value or `undefined` if no default is supplied.
