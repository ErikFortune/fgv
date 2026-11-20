[Home](../../README.md) > [Conversion](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > or

## GenericDefaultingConverter.or() method

Chains this converter with another of the same type, to be attempted if this
converter fails.

**Signature:**

```typescript
or(__converter: Converter<T, TC>): DefaultingConverter<T, TD, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__converter</td><td>Converter&lt;T, TC&gt;</td><td></td></tr>
</tbody></table>

**Returns:**

[DefaultingConverter](../../interfaces/DefaultingConverter.md)&lt;T, TD, TC&gt;
