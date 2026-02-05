[Home](../../README.md) > [LibraryRuntime](../README.md) > [SugarIngredient](./SugarIngredient.md) > create

## SugarIngredient.create() method

Factory method for creating a SugarIngredient.

**Signature:**

```typescript
static create(context: IIngredientContext, id: IngredientId, ingredient: ISugarIngredientEntity): Result<SugarIngredient>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IIngredientContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>IngredientId</td><td>The ingredient ID</td></tr>
<tr><td>ingredient</td><td>ISugarIngredientEntity</td><td>The sugar ingredient data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SugarIngredient](../../classes/SugarIngredient.md)&gt;

Success with SugarIngredient
