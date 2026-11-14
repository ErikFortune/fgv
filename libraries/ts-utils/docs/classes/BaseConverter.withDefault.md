[Home](../README.md) > [BaseConverter](./BaseConverter.md) > withDefault

## BaseConverter.withDefault() method

Returns a Converter which always succeeds with a default value rather than failing.

**Signature:**

```typescript
withDefault(defaultValue: TD): DefaultingConverter<T, TD, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>defaultValue</td><td>TD</td><td>The default value to use if conversion fails.</td></tr>
</tbody></table>

**Returns:**

[DefaultingConverter](../interfaces/DefaultingConverter.md)&lt;T, TD, TC&gt;
