[Home](../README.md) > [Converter](./Converter.md) > withItemTypeGuard

## Converter.withItemTypeGuard() method

Creates a Converter which applies a supplied type guard to each member of
the conversion result from this converter.

**Signature:**

```typescript
withItemTypeGuard(guard: (from: unknown, context?: TC) => from is TI, message?: string): Converter<TI[], TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>guard</td><td>(from: unknown, context?: TC) =&gt; from is TI</td><td>The type guard function to apply to each element.</td></tr>
<tr><td>message</td><td>string</td><td>Optional message to be reported if the type guard fails.</td></tr>
</tbody></table>

**Returns:**

[Converter](Converter.md)&lt;TI[], TC&gt;

A new Converter returning `<TI>`.
