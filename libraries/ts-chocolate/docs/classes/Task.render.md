[Home](../README.md) > [Task](./Task.md) > render

## Task.render() method

Renders the task template with the given params (merged with defaults).

**Signature:**

```typescript
render(params: Record<string, unknown>): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>Record&lt;string, unknown&gt;</td><td>The parameter values for template rendering</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Success with rendered string, or Failure if rendering fails
