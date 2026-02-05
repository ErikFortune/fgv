[Home](../README.md) > [EditorContext](./EditorContext.md) > validate

## EditorContext.validate() method

Validate pre-validated entity using semantic validator.
For full validation including converter, use validating.validate().

**Signature:**

```typescript
validate(entity: T): Result<IValidationReport>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entity</td><td>T</td><td>Pre-validated entity to check semantic rules</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidationReport](../interfaces/IValidationReport.md)&gt;

Result containing validation report or failure
