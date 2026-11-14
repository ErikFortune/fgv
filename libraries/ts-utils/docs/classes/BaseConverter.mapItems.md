[Home](../README.md) > [BaseConverter](./BaseConverter.md) > mapItems

## BaseConverter.mapItems() method

Creates a Converter which maps the individual items of a collection
resulting from this Converter using the supplied map function.

**Signature:**

```typescript
mapItems(mapper: (from: unknown, context?: TC) => Result<TI>): Converter<TI[], TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>mapper</td><td>(from: unknown, context?: TC) =&gt; Result&lt;TI&gt;</td><td>The map function to be applied to each element of the
result of this Converter.</td></tr>
</tbody></table>

**Returns:**

[Converter](../interfaces/Converter.md)&lt;TI[], TC&gt;

A new Converter returning `<TI[]>`.
