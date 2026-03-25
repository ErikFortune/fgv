[Home](../README.md) > [Failure](./Failure.md) > withDetail

## Failure.withDetail() method

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,
adding supplied details.

**Signature:**

```typescript
withDetail(detail: TD, __successDetail?: TD): DetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>detail</td><td>TD</td><td>The default detail to be added to the new DetailedResult.</td></tr>
<tr><td>__successDetail</td><td>TD</td><td>An optional detail to be added if this result was successful.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;T, TD&gt;

A new DetailedResult | DetailedResult<T, TD> with either
the success result or the error message from this IResult and the
appropriate added detail.
