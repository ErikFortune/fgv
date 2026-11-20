[Home](../../README.md) > [Mustache](../README.md) > [MustacheTemplate](./MustacheTemplate.md) > renderWithSegments

## MustacheTemplate.renderWithSegments() method

Renders the template and reports which part of the output came from where.

**Signature:**

```typescript
renderWithSegments(context: unknown): Result<IRenderedTemplate>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>unknown</td><td>The context object for template rendering.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IRenderedTemplate](../../interfaces/IRenderedTemplate.md)&gt;

Success with the rendered text and its segment map, or Failure if the
template contains a construct this cannot describe
