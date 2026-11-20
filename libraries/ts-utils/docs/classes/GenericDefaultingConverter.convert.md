[Home](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > convert

## GenericDefaultingConverter.convert() method

Converts from `unknown` to `<T>`.  For objects and arrays, is guaranteed
to return a new entity, with any unrecognized properties removed.

**Signature:**

```typescript
convert(from: unknown, ctx?: TC): Success<T | TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` to be converted</td></tr>
<tr><td>ctx</td><td>TC</td><td>An optional conversion context of type `<TC>` to be used in
the conversion.</td></tr>
</tbody></table>

**Returns:**

[Success](Success.md)&lt;T | TD&gt;

A Result with a Success and a value on success or an
Failure with a a message on failure.
