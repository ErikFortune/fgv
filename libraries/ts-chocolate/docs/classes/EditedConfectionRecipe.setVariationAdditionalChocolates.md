[Home](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationAdditionalChocolates

## EditedConfectionRecipe.setVariationAdditionalChocolates() method

Sets the additional chocolates (seal, decoration) on a molded bon-bon variation.

**Signature:**

```typescript
setVariationAdditionalChocolates(spec: ConfectionRecipeVariationSpec, additionalChocolates: readonly IAdditionalChocolateEntity[] | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>additionalChocolates</td><td>readonly IAdditionalChocolateEntity[] | undefined</td><td>New additional chocolates array, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found or not a molded bon-bon
