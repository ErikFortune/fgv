[Home](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > withFormattedError

## GenericDefaultingConverter.withFormattedError() method

Creates a new Converter which is derived from this one but which returns an
error message formatted by the supplied formatter if the conversion fails.

**Signature:**

```typescript
withFormattedError(formatter: ConversionErrorFormatter<TC>): Converter<T | TD, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>formatter</td><td>ConversionErrorFormatter&lt;TC&gt;</td><td>The formatter to be applied.</td></tr>
</tbody></table>

**Returns:**

[Converter](../interfaces/Converter.md)&lt;T | TD, TC&gt;

A new Converter returning `<T>`.
