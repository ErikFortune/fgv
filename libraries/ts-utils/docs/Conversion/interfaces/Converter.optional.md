[Home](../../README.md) > [Conversion](../README.md) > [Converter](./Converter.md) > optional

## Converter.optional() method

Creates a Converter for an optional value.

**Signature:**

```typescript
optional(onError?: OnError): Converter<T | undefined, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>onError</td><td>OnError</td><td>Specifies handling of values that cannot be converted (default `ignoreErrors`).</td></tr>
</tbody></table>

**Returns:**

[Converter](../../interfaces/Converter.md)&lt;T | undefined, TC&gt;

A new Converter returning `<T|undefined>`.
