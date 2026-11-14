[Home](../README.md) > [Converter](./Converter.md) > withFormattedError

## Converter.withFormattedError() method

Creates a new Converter which is derived from this one but which returns an
error message formatted by the supplied formatter if the conversion fails.

**Signature:**

```typescript
withFormattedError(formatter: ConversionErrorFormatter<TC>): Converter<T, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>formatter</td><td>ConversionErrorFormatter&lt;TC&gt;</td><td>The formatter to be applied.</td></tr>
</tbody></table>

**Returns:**

[Converter](Converter.md)&lt;T, TC&gt;

A new Converter returning `<T>`.
