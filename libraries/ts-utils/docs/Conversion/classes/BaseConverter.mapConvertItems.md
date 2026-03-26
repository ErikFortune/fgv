[Home](../../README.md) > [Conversion](../README.md) > [BaseConverter](./BaseConverter.md) > mapConvertItems

## BaseConverter.mapConvertItems() method

Creates a Converter which maps the individual items of a collection
resulting from this Converter using the supplied Converter.

**Signature:**

```typescript
mapConvertItems(mapConverter: Converter<TI, unknown>): Converter<TI[], TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>mapConverter</td><td>Converter&lt;TI, unknown&gt;</td><td>The Converter to be applied to each element of the
result of this Converter.</td></tr>
</tbody></table>

**Returns:**

[Converter](../../interfaces/Converter.md)&lt;TI[], TC&gt;

A new Converter returning `<TI[]>`.
