[Home](../README.md) > [Task](./Task.md) > validateAndRender

## Task.validateAndRender() method

Validates params and renders the template if validation passes.

**Signature:**

```typescript
validateAndRender(params: Record<string, unknown>): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>Record&lt;string, unknown&gt;</td><td>The parameter values to validate and render with</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Success with rendered string, or Failure with validation or render errors
