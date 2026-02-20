[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > replaceVariation

## EditedConfectionRecipe.replaceVariation() method

Replaces a variation's entity data (called after ConfectionEditingSession save).

**Signature:**

```typescript
replaceVariation(spec: ConfectionRecipeVariationSpec, variation: AnyConfectionRecipeVariationEntity): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to replace</td></tr>
<tr><td>variation</td><td>AnyConfectionRecipeVariationEntity</td><td>New variation entity data</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
