[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationName

## EditedConfectionRecipe.setVariationName() method

Sets or clears the display name on a variation.

**Signature:**

```typescript
setVariationName(spec: ConfectionRecipeVariationSpec, name: string | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>name</td><td>string | undefined</td><td>New display name, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
