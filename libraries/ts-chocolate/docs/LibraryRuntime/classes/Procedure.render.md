[Home](../../README.md) > [LibraryRuntime](../README.md) > [Procedure](./Procedure.md) > render

## Procedure.render() method

Renders the procedure with the given context.
Resolves task references to actual task content (not placeholders).

This is the main difference from the data-layer Procedure.render():
- Data layer: Returns `[Task: taskId]` placeholders for task references
- Runtime layer: Actually resolves task references and renders templates

**Signature:**

```typescript
render(renderContext: IProcedureRenderContext): Result<IRenderedProcedure>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>renderContext</td><td>IProcedureRenderContext</td><td>The render context with recipe and library access</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IRenderedProcedure](../../interfaces/IRenderedProcedure.md)&gt;

Success with rendered procedure, or Failure if rendering fails
