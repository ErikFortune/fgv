[Home](../README.md) > [ObjectConverter](./ObjectConverter.md) > addPartial

## ObjectConverter.addPartial() method

Creates a new Conversion.ObjectConverter | ObjectConverter derived from this one but with
new optional properties as specified by a supplied array of `keyof T`.

**Signature:**

```typescript
addPartial(addOptionalProperties: (keyof T)[]): ObjectConverter<Partial<T>, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>addOptionalProperties</td><td>(keyof T)[]</td><td>The keys to be made optional.</td></tr>
</tbody></table>

**Returns:**

[ObjectConverter](ObjectConverter.md)&lt;Partial&lt;T&gt;, TC&gt;

A new Conversion.ObjectConverter | ObjectConverter with the additional optional source
properties.
