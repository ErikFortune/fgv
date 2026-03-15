[Home](../../README.md) > [Editing](../README.md) > [IngredientEditorContext](./IngredientEditorContext.md) > createFromCollection

## IngredientEditorContext.createFromCollection() method

Create an ingredient editor context from a collection.

**Signature:**

```typescript
static createFromCollection(collection: EditableCollection<IngredientEntity, BaseIngredientId>): Result<IngredientEditorContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collection</td><td>EditableCollection&lt;IngredientEntity, BaseIngredientId&gt;</td><td>Mutable collection of ingredients</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IngredientEditorContext](../../classes/IngredientEditorContext.md)&gt;

Result containing the editor context or failure
