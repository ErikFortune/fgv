[Home](../../README.md) > [Editing](../README.md) > [EditorContextValidator](./EditorContextValidator.md) > validate

## EditorContextValidator.validate() method

Validate raw entity data using converter and semantic validator.

**Signature:**

```typescript
validate(rawEntity: unknown): Result<IValidationReport>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>rawEntity</td><td>unknown</td><td>Raw entity data to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidationReport](../../interfaces/IValidationReport.md)&gt;

Result containing validation report or failure
