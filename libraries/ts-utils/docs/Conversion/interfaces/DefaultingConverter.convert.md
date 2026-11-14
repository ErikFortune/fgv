[Home](../../README.md) > [Conversion](../README.md) > [DefaultingConverter](./DefaultingConverter.md) > convert

## DefaultingConverter.convert() method

Convert the supplied `unknown` to `Success<T>` or to the `Success` with the default value
if conversion is not possible.

**Signature:**

```typescript
convert(from: unknown, ctx?: TC): Success<T | TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>the value to be converted.</td></tr>
<tr><td>ctx</td><td>TC</td><td>optional context for the conversion.</td></tr>
</tbody></table>

**Returns:**

[Success](../../classes/Success.md)&lt;T | TD&gt;
