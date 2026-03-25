[Home](../../README.md) > [Conversion](../README.md) > [Converter](./Converter.md) > mapConvert

## Converter.mapConvert() method

Creates a Converter which applies an additional supplied
converter to the result of this converter.

**Signature:**

```typescript
mapConvert(mapConverter: Converter<T2, unknown>): Converter<T2, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>mapConverter</td><td>Converter&lt;T2, unknown&gt;</td><td>The Converter to be applied to the
converted result from this Converter.</td></tr>
</tbody></table>

**Returns:**

[Converter](../../interfaces/Converter.md)&lt;T2, TC&gt;

A new Converter returning `<T2>`.
