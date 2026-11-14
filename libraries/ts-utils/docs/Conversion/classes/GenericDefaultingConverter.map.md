[Home](../../README.md) > [Conversion](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > map

## GenericDefaultingConverter.map() method

Creates a Converter which applies a (possibly) mapping conversion to
the converted value of this Converter.

**Signature:**

```typescript
map(mapper: (from: T | TD) => Result<T2>): Converter<T2, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>mapper</td><td>(from: T | TD) =&gt; Result&lt;T2&gt;</td><td>A function which maps from the the result type `<T>` of this
converter to a new result type `<T2>`.</td></tr>
</tbody></table>

**Returns:**

[Converter](../../interfaces/Converter.md)&lt;T2, TC&gt;

A new Converter returning `<T2>`.
