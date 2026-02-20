[Home](../../README.md) > [LibraryRuntime](../README.md) > [EditedConfectionRecipe](./EditedConfectionRecipe.md) > setVariationProcedures

## EditedConfectionRecipe.setVariationProcedures() method

Sets the procedures on a variation.

**Signature:**

```typescript
setVariationProcedures(spec: ConfectionRecipeVariationSpec, procedures: IOptionsWithPreferred<IProcedureRefEntity, ProcedureId> | undefined): Result<void>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>ConfectionRecipeVariationSpec</td><td>Variation spec to update</td></tr>
<tr><td>procedures</td><td>IOptionsWithPreferred&lt;IProcedureRefEntity, ProcedureId&gt; | undefined</td><td>New procedures spec, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;void&gt;

Success or failure if spec not found
