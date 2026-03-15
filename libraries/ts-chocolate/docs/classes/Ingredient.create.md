[Home](../README.md) > [Ingredient](./Ingredient.md) > create

## Ingredient.create() method

Factory method that auto-detects ingredient type and returns appropriate concrete class.

**Signature:**

```typescript
static create(context: IIngredientContext, id: IngredientId, ingredient: IngredientEntity): Result<AnyIngredient>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IIngredientContext</td><td>The runtime context for navigation</td></tr>
<tr><td>id</td><td>IngredientId</td><td>The ingredient ID</td></tr>
<tr><td>ingredient</td><td>IngredientEntity</td><td>The ingredient data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AnyIngredient](../type-aliases/AnyIngredient.md)&gt;

Success with the appropriate concrete Ingredient subclass, or Failure for unknown category
