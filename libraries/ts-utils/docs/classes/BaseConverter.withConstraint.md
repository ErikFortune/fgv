[Home](../README.md) > [BaseConverter](./BaseConverter.md) > withConstraint

## BaseConverter.withConstraint() method

Creates a Converter which applies an optional constraint to the result
of this conversion.  If this Converter (the base converter) succeeds, the new
converter calls a supplied constraint evaluation function with the conversion, which
fails the entire conversion if the constraint function returns either `false` or
Failure | Failure<T>.

**Signature:**

```typescript
withConstraint(constraint: (val: T, context?: TC) => boolean | Result<T>, options?: ConstraintOptions): Converter<T, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>constraint</td><td>(val: T, context?: TC) =&gt; boolean | Result&lt;T&gt;</td><td>Constraint evaluation function.</td></tr>
<tr><td>options</td><td>ConstraintOptions</td><td>Conversion.ConstraintOptions | Options for constraint evaluation.</td></tr>
</tbody></table>

**Returns:**

[Converter](../interfaces/Converter.md)&lt;T, TC&gt;

A new Converter returning `<T>`.
