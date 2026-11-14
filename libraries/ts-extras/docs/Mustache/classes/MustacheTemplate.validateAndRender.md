[Home](../../README.md) > [Mustache](../README.md) > [MustacheTemplate](./MustacheTemplate.md) > validateAndRender

## MustacheTemplate.validateAndRender() method

Validates the context and renders the template if validation passes.

**Signature:**

```typescript
validateAndRender(context: unknown): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>unknown</td><td>The context object to validate and render with</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Success with the rendered string, or Failure with validation or render errors
