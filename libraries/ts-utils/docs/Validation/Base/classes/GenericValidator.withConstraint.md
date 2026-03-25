[Home](../../../README.md) > [Validation](../../README.md) > [Base](../README.md) > [GenericValidator](./GenericValidator.md) > withConstraint

## GenericValidator.withConstraint() method

Creates an Validation.Validator | in-place validator
which is derived from this one but which applies additional constraints.

**Signature:**

```typescript
withConstraint(constraint: Constraint<T>, trait?: FunctionConstraintTrait): Validator<T, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>constraint</td><td>Constraint&lt;T&gt;</td><td>the constraint to be applied</td></tr>
<tr><td>trait</td><td>FunctionConstraintTrait</td><td>As optional Validation.ConstraintTrait | ConstraintTrait
to be applied to the resulting Validation.Validator | Validator.</td></tr>
</tbody></table>

**Returns:**

[Validator](../../../interfaces/Validator.md)&lt;T, TC&gt;

A new Validation.Validator | Validator.
