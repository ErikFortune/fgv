[Home](../README.md) > [Failure](./Failure.md) > orDefault

## Failure.orDefault() method

Gets the value associated with a successful IResult | result,
or a default value if the corresponding operation failed.

**Signature:**

```typescript
orDefault(dflt: T): T;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dflt</td><td>T</td><td>The value to be returned if the operation failed.</td></tr>
</tbody></table>

**Returns:**

T

The return value, if the operation was successful.  Returns
the supplied default if an error occurred.
SUPPLIED
