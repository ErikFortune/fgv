[Home](../../README.md) > [Editing](../README.md) > [ValidationReport](./ValidationReport.md) > withErrors

## ValidationReport.withErrors() method

Create a validation report with both field and general errors.

**Signature:**

```typescript
static withErrors(fieldErrors: Map<string, string>, generalErrors: string[]): ValidationReport;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>fieldErrors</td><td>Map&lt;string, string&gt;</td><td>Map of field paths to error messages</td></tr>
<tr><td>generalErrors</td><td>string[]</td><td>Array of general error messages</td></tr>
</tbody></table>

**Returns:**

[ValidationReport](../../classes/ValidationReport.md)

Validation report with all errors
