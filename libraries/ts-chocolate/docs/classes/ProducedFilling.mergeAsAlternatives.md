[Home](../README.md) > [ProducedFilling](./ProducedFilling.md) > mergeAsAlternatives

## ProducedFilling.mergeAsAlternatives() method

Merges produced ingredient choices as alternatives into the original variation.
Preserves original amounts and structure; only adds ingredient IDs as options.

**Signature:**

```typescript
static mergeAsAlternatives(produced: IProducedFillingEntity, original: IFillingRecipeVariationEntity): Result<IFillingRecipeVariationEntity>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>produced</td><td>IProducedFillingEntity</td><td>The produced filling with user's ingredient choices</td></tr>
<tr><td>original</td><td>IFillingRecipeVariationEntity</td><td>The original source variation entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingRecipeVariationEntity](../interfaces/IFillingRecipeVariationEntity.md)&gt;

Result with updated variation entity containing merged alternatives
