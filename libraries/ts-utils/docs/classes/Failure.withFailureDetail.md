[Home](../README.md) > [Failure](./Failure.md) > withFailureDetail

## Failure.withFailureDetail() method

Converts a IResult | IResult<T> to a DetailedResult | DetailedResult<T, TD>,
adding a supplied detail if the operation failed.

**Signature:**

```typescript
withFailureDetail(detail: TD): DetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>detail</td><td>TD</td><td>The detail to be added if this operation failed.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;T, TD&gt;

A new DetailedResult | DetailedResult<T, TD> with either
the success result or the error message from this IResult, with
the supplied detail (if this event failed) or detail `undefined` (if
this result succeeded).
