[Home](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > withDefault

## GenericDefaultingConverter.withDefault() method

Returns a Converter which always succeeds with the supplied default value rather
than failing.

Note that the supplied default value *overrides* the default value of this
Conversion.DefaultingConverter | DefaultingConverter.

**Signature:**

```typescript
withDefault(dflt: TD2): DefaultingConverter<T, TD2, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>dflt</td><td>TD2</td><td></td></tr>
</tbody></table>

**Returns:**

[DefaultingConverter](../interfaces/DefaultingConverter.md)&lt;T, TD2, TC&gt;
