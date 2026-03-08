[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationYield

## EditedConfectionRecipe.setVariationYield() method

Sets the yield specification on a variation.

**Signature:**

```typescript
setVariationYield(spec: ConfectionRecipeVariationSpec, yieldSpec: ConfectionYield): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>yieldSpec</td><td>ConfectionYield</td><td>New yield specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
