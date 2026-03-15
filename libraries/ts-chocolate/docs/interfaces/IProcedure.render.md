[Home](../README.md) > [IProcedure](./IProcedure.md) > render

## IProcedure.render() method

Renders the procedure with the given context.
Resolves task references to actual task content (not placeholders).

**Signature:**

```typescript
render(context: IProcedureRenderContext): Result<IRenderedProcedure>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IProcedureRenderContext</td><td>The render context with recipe and library access</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IRenderedProcedure](IRenderedProcedure.md)&gt;

Success with rendered procedure, or Failure if rendering fails
