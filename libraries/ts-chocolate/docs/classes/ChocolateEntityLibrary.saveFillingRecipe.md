[Home](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > saveFillingRecipe

## ChocolateEntityLibrary.saveFillingRecipe() method

Save a filling recipe entity to a mutable collection.

Sets the entity in the SubLibrary (in-memory), then persists to disk
via the persisted collection singleton. Fails if persistence is unavailable
or if disk save fails.

**Signature:**

```typescript
saveFillingRecipe(collectionId: CollectionId, baseId: BaseFillingId, entity: IFillingRecipeEntity): Promise<Result<string>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collectionId</td><td>CollectionId</td><td>Target collection (must be mutable)</td></tr>
<tr><td>baseId</td><td>BaseFillingId</td><td>Base filling ID</td></tr>
<tr><td>entity</td><td>IFillingRecipeEntity</td><td>The filling recipe entity to save</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;string&gt;&gt;

Composite filling ID on success
