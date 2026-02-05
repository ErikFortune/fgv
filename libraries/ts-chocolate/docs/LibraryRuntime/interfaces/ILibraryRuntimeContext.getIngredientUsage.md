[Home](../../README.md) > [LibraryRuntime](../README.md) > [ILibraryRuntimeContext](./ILibraryRuntimeContext.md) > getIngredientUsage

## ILibraryRuntimeContext.getIngredientUsage() method

Gets detailed usage information for an ingredient.

**Signature:**

```typescript
getIngredientUsage(ingredientId: IngredientId): Result<readonly IIngredientUsageInfo[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>ingredientId</td><td>IngredientId</td><td>The ingredient ID to look up</td></tr>
</tbody></table>

**Returns:**

Result&lt;readonly [IIngredientUsageInfo](../../interfaces/IIngredientUsageInfo.md)[]&gt;

Success with array of usage info, or Failure if ingredient doesn't exist
