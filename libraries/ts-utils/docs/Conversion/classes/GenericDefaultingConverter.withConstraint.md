[Home](../../README.md) > [Conversion](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > withConstraint

## GenericDefaultingConverter.withConstraint() method

Creates a Converter which applies an optional constraint to the result
of this conversion.  If this Converter (the base converter) succeeds, the new
converter calls a supplied constraint evaluation function with the conversion, which
fails the entire conversion if the constraint function returns either `false` or
Failure | Failure<T>.

**Signature:**

```typescript
withConstraint(constraint: (val: T | TD) => boolean | Result<T | TD>, options?: ConstraintOptions): Converter<T | TD, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>constraint</td><td>(val: T | TD) =&gt; boolean | Result&lt;T | TD&gt;</td><td>Constraint evaluation function.</td></tr>
<tr><td>options</td><td>ConstraintOptions</td><td>Conversion.ConstraintOptions | Options for constraint evaluation.</td></tr>
</tbody></table>

**Returns:**

[Converter](../../interfaces/Converter.md)&lt;T | TD, TC&gt;

A new Converter returning `<T>`.
