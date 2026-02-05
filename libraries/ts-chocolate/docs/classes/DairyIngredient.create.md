[Home](../README.md) > [DairyIngredient](./DairyIngredient.md) > create

## DairyIngredient.create() method

Factory method for creating a DairyIngredient.

**Signature:**

```typescript
static create(context: IIngredientContext, id: IngredientId, ingredient: IDairyIngredientEntity): Result<DairyIngredient>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IIngredientContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>IngredientId</td><td>The ingredient ID</td></tr>
<tr><td>ingredient</td><td>IDairyIngredientEntity</td><td>The dairy ingredient data entity</td></tr>
</tbody></table>

**Returns:**

Result&lt;[DairyIngredient](DairyIngredient.md)&gt;

Success with DairyIngredient
