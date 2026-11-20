[Home](../../README.md) > [Conversion](../README.md) > [ObjectConverter](./ObjectConverter.md) > convertPartial

## ObjectConverter.convertPartial() method

Converts the supplied object using the Conversion.ObjectConverter | ObjectConverter
with all fields optional.

**Signature:**

```typescript
convertPartial(from: unknown, context?: TC): Result<Partial<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The object to be converted.</td></tr>
<tr><td>context</td><td>TC</td><td>An optional context object passed to the field converters.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;Partial&lt;T&gt;&gt;

A Result containing the converted object or an error message.
