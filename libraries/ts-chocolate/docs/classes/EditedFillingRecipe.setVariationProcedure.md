[Home](../README.md) > [EditedFillingRecipe](./EditedFillingRecipe.md) > setVariationProcedure

## EditedFillingRecipe.setVariationProcedure() method

Sets or clears the procedure for a variation.
If `procedureId` is given, sets it as the sole preferred procedure option
(adding to existing options if present).
If `undefined`, clears procedures entirely.

**Signature:**

```typescript
setVariationProcedure(spec: FillingRecipeVariationSpec, procedureId: ProcedureId | undefined): Result<true>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>FillingRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>procedureId</td><td>ProcedureId | undefined</td><td>Procedure ID to set, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;true&gt;

Success or failure if spec not found
