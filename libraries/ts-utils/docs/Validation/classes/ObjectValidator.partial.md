[Home](../../README.md) > [Validation](../README.md) > [ObjectValidator](./ObjectValidator.md) > partial

## ObjectValidator.partial() method

Creates a new Validation.Classes.ObjectValidator | ObjectValidator derived from this one but with
new optional properties as specified by a supplied
Validation.Classes.ObjectValidatorOptions | ObjectValidatorOptions<T>.

**Signature:**

```typescript
partial(options?: ObjectValidatorOptions<T, TC>): ObjectValidator<Partial<T>, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ObjectValidatorOptions&lt;T, TC&gt;</td><td>The Validation.Classes.ObjectValidatorOptions | options to be applied to the new
Validation.Classes.ObjectValidator | validator.</td></tr>
</tbody></table>

**Returns:**

[ObjectValidator](../../classes/ObjectValidator.md)&lt;Partial&lt;T&gt;, TC&gt;

A new Validation.Classes.ObjectValidator | ObjectValidator with the additional optional
source properties.
