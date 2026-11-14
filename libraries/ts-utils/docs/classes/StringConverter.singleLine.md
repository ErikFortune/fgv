[Home](../README.md) > [StringConverter](./StringConverter.md) > singleLine

## StringConverter.singleLine() method

Returns a Conversion.StringConverter | StringConverter which constrains the result to a
single line of printable text: no line breaks, no control characters, non-empty, and optionally
bounded in length.

**Signature:**

```typescript
singleLine(options?: SingleLineOptions): StringConverter<T, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>SingleLineOptions</td><td>Optional Conversion.SingleLineOptions for this conversion.</td></tr>
</tbody></table>

**Returns:**

[StringConverter](StringConverter.md)&lt;T, TC&gt;

Success with a conforming string, or Failure with an informative error.
