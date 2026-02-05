[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > [EditingSession](./EditingSession.md) > saveAsNewRecipe

## EditingSession.saveAsNewRecipe() method

Saves as an entirely new recipe with new ID.
Use when collection is immutable or creating a derivative recipe.

**Signature:**

```typescript
saveAsNewRecipe(options: ISaveNewRecipeOptions): Result<ISaveResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ISaveNewRecipeOptions</td><td>Save options including new ID, version spec, and base weight</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ISaveResult](../../../interfaces/ISaveResult.md)&gt;

Result with save result containing journal entry
