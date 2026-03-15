[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationFillings

## EditedConfectionRecipe.setVariationFillings() method

Sets the filling slots on a variation.

**Signature:**

```typescript
setVariationFillings(spec: ConfectionRecipeVariationSpec, fillings: readonly IFillingSlotEntity[] | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>fillings</td><td>readonly IFillingSlotEntity[] | undefined</td><td>New filling slots array, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
