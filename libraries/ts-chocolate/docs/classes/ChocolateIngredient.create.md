[Home](../README.md) > [ChocolateIngredient](./ChocolateIngredient.md) > create

## ChocolateIngredient.create() method

Factory method for creating a ChocolateIngredient.

**Signature:**

```typescript
static create(context: IIngredientContext, id: IngredientId, ingredient: IChocolateIngredientEntity): Result<ChocolateIngredient>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IIngredientContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>IngredientId</td><td>The ingredient ID</td></tr>
<tr><td>ingredient</td><td>IChocolateIngredientEntity</td><td>The chocolate ingredient data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ChocolateIngredient](ChocolateIngredient.md)&gt;

Success with ChocolateIngredient
