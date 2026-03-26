[Home](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > withTypeGuard

## GenericDefaultingConverter.withTypeGuard() method

Creates a Converter which applies a supplied type guard to the conversion
result.

**Signature:**

```typescript
withTypeGuard(guard: (from: unknown) => from is TI, message?: string): Converter<TI, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>guard</td><td>(from: unknown) =&gt; from is TI</td><td>The type guard function to apply.</td></tr>
<tr><td>message</td><td>string</td><td>Optional message to be reported if the type guard fails.</td></tr>
</tbody></table>

**Returns:**

[Converter](../interfaces/Converter.md)&lt;TI, TC&gt;

A new Converter returning `<TI>`.
