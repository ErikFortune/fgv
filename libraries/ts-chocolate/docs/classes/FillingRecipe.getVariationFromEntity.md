[Home](../README.md) > [FillingRecipe](./FillingRecipe.md) > getVariationFromEntity

## FillingRecipe.getVariationFromEntity() method

Wraps an arbitrary variation entity using this recipe's context.
Useful for creating a runtime variation from an entity that is not yet persisted
(e.g., a newly added variation that exists only in the wrapper's in-memory state).

**Signature:**

```typescript
getVariationFromEntity(entity: IFillingRecipeVariationEntity): Result<FillingRecipeVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entity</td><td>IFillingRecipeVariationEntity</td><td>The variation entity to wrap</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipeVariation](FillingRecipeVariation.md)&gt;

Success with FillingRecipeVariation
