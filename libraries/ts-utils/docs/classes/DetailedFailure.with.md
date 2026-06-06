[Home](../README.md) > [DetailedFailure](./DetailedFailure.md) > with

## DetailedFailure.with() method

Creates a DetailedFailure | DetailedFailure<T, TD> with the supplied error message
and optional detail.

**Signature:**

```typescript
static with(message: string, detail?: TD): DetailedFailure<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>message</td><td>string</td><td>The error message to be returned.</td></tr>
<tr><td>detail</td><td>TD</td><td>The error detail to be returned.</td></tr>
</tbody></table>

**Returns:**

[DetailedFailure](DetailedFailure.md)&lt;T, TD&gt;

The resulting DetailedFailure | DetailedFailure<T, TD> with the supplied
error message and detail.
