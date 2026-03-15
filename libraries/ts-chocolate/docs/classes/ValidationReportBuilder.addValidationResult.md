[Home](../README.md) > [ValidationReportBuilder](./ValidationReportBuilder.md) > addValidationResult

## ValidationReportBuilder.addValidationResult() method

Add errors from a validation result.
If the result is a failure, adds it as a field error.

**Signature:**

```typescript
addValidationResult(fieldPath: string, result: Result<unknown>): this;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fieldPath</td><td>string</td><td>Field path for the error</td></tr>
<tr><td>result</td><td>Result&lt;unknown&gt;</td><td>Validation result</td></tr>
</tbody></table>

**Returns:**

this
