[Home](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > optional

## GenericDefaultingConverter.optional() method

Creates a Converter for an optional value.

**Signature:**

```typescript
optional(onError?: "failOnError" | "ignoreErrors"): Converter<T | TD | undefined, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>onError</td><td>"failOnError" | "ignoreErrors"</td><td>Specifies handling of values that cannot be converted (default `ignoreErrors`).</td></tr>
</tbody></table>

**Returns:**

[Converter](../interfaces/Converter.md)&lt;T | TD | undefined, TC&gt;

A new Converter returning `<T|undefined>`.
