[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationNotes

## EditedConfectionRecipe.setVariationNotes() method

Sets the notes on a variation.

**Signature:**

```typescript
setVariationNotes(spec: ConfectionRecipeVariationSpec, notes: readonly ICategorizedNote[] | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>notes</td><td>readonly ICategorizedNote[] | undefined</td><td>New notes array, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
