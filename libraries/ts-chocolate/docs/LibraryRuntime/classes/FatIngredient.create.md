[Home](../../README.md) > [LibraryRuntime](../README.md) > [FatIngredient](./FatIngredient.md) > create

## FatIngredient.create() method

Factory method for creating a FatIngredient.

**Signature:**

```typescript
static create(context: IIngredientContext, id: IngredientId, ingredient: IFatIngredientEntity): Result<FatIngredient>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IIngredientContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>IngredientId</td><td>The ingredient ID</td></tr>
<tr><td>ingredient</td><td>IFatIngredientEntity</td><td>The fat ingredient data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FatIngredient](../../classes/FatIngredient.md)&gt;

Success with FatIngredient
