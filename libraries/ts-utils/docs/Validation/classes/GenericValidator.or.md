[Home](../../README.md) > [Validation](../README.md) > [GenericValidator](./GenericValidator.md) > or

## GenericValidator.or() method

Chains this validator with another of the same type, to be attempted if this
validator fails.

**Signature:**

```typescript
or(other: Validator<T, TC>): Validator<T, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>other</td><td>Validator&lt;T, TC&gt;</td><td>The other Validation.Validator | Validator to be attempted
if this one fails.</td></tr>
</tbody></table>

**Returns:**

[Validator](../../interfaces/Validator.md)&lt;T, TC&gt;
