[Home](../README.md) > [GenericValidator](./GenericValidator.md) > validateOptional

## GenericValidator.validateOptional() method

Tests to see if a supplied `unknown` value matches this
validation.  Accepts `undefined`.

**Signature:**

```typescript
validateOptional(from: unknown, context?: TC): Result<T | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` value to be tested.</td></tr>
<tr><td>context</td><td>TC</td><td>Optional validation context.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;T | undefined&gt;

Success with the typed, validated value,
or Failure with an error message if validation fails.
