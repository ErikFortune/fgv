[Home](../../README.md) > [LibraryRuntime](../README.md) > [AlcoholIngredient](./AlcoholIngredient.md) > create

## AlcoholIngredient.create() method

Factory method for creating a AlcoholIngredient.

**Signature:**

```typescript
static create(context: IIngredientContext, id: IngredientId, ingredient: IAlcoholIngredientEntity): Result<AlcoholIngredient>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IIngredientContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>IngredientId</td><td>The ingredient ID</td></tr>
<tr><td>ingredient</td><td>IAlcoholIngredientEntity</td><td>The raw alcohol ingredient data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AlcoholIngredient](../../classes/AlcoholIngredient.md)&gt;

Success with AlcoholIngredient
