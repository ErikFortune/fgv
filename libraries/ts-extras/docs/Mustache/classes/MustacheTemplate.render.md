[Home](../../README.md) > [Mustache](../README.md) > [MustacheTemplate](./MustacheTemplate.md) > render

## MustacheTemplate.render() method

Renders the template with the given context.
Use this for pre-validated contexts where you've already checked
that all required variables are present.

**Signature:**

```typescript
render(context: unknown): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>unknown</td><td>The context object for template rendering</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Success with the rendered string, or Failure if rendering fails
