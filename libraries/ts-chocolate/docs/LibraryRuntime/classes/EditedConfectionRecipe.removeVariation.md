[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > removeVariation

## EditedConfectionRecipe.removeVariation() method

Removes a variation from the recipe.
Cannot remove the last variation or the golden variation.

**Signature:**

```typescript
removeVariation(spec: ConfectionRecipeVariationSpec): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to remove</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure
