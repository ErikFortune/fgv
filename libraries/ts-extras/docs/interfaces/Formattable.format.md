[Home](../README.md) > [Formattable](./Formattable.md) > format

## Formattable.format() method

Formats an object using the supplied mustache template.

**Signature:**

```typescript
format(format: string): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>format</td><td>string</td><td>A mustache template used to format the object.</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success<string>` with the resulting string, or `Failure<string>`
with an error message if an error occurs.
