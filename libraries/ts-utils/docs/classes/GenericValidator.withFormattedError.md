[Home](../README.md) > [GenericValidator](./GenericValidator.md) > withFormattedError

## GenericValidator.withFormattedError() method

Creates a new Validation.Validator | in-place validator which
is derived from this one but which returns an error message supplied
by the provided formatter if an error occurs.

**Signature:**

```typescript
withFormattedError(formatter: ValidationErrorFormatter<TC>): Validator<T, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>formatter</td><td>ValidationErrorFormatter&lt;TC&gt;</td><td>The error message formatter to be applied.</td></tr>
</tbody></table>

**Returns:**

[Validator](../interfaces/Validator.md)&lt;T, TC&gt;

A new Validation.Validator | Validator.
