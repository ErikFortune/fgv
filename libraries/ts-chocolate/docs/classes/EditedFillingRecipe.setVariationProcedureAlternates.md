[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationProcedureAlternates

## EditedFillingRecipe.setVariationProcedureAlternates() method

Updates the procedure options and preferred selection for a specific variation.
Pass an empty options array to clear all procedures.

**Signature:**

```typescript
setVariationProcedureAlternates(spec: FillingRecipeVariationSpec, options: readonly IProcedureRefEntity[], preferredId: ProcedureId | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>options</td><td>readonly IProcedureRefEntity[]</td><td>New full list of procedure ref entities</td></tr>
<tr><td>preferredId</td><td>ProcedureId | undefined</td><td>Which procedure ID to mark as preferred (must be in options, or undefined)</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found or preferredId not in options
