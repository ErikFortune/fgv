[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > create

## FillingRecipe.create() method

Factory method for creating a FillingRecipe.

**Signature:**

```typescript
static create(context: RecipeContext, id: FillingId, recipe: IFillingRecipeEntity): Result<FillingRecipe>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>RecipeContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>FillingId</td><td>The recipe ID</td></tr>
<tr><td>recipe</td><td>IFillingRecipeEntity</td><td>The data layer recipe entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipe](../../classes/FillingRecipe.md)&gt;

Success with FillingRecipe
