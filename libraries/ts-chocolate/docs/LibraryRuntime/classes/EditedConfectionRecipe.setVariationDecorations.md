[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationDecorations

## EditedConfectionRecipe.setVariationDecorations() method

Sets the decorations on a variation.

**Signature:**

```typescript
setVariationDecorations(spec: ConfectionRecipeVariationSpec, decorations: IOptionsWithPreferred<IDecorationRefEntity, DecorationId> | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>decorations</td><td>IOptionsWithPreferred&lt;IDecorationRefEntity, DecorationId&gt; | undefined</td><td>New decorations spec, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
