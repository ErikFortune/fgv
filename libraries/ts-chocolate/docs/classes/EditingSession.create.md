[Home](../README.md) > [EditingSession](./EditingSession.md) > create

## EditingSession.create() method

Creates a new EditingSession from a base recipe version.

**Signature:**

```typescript
static create(baseRecipe: IFillingRecipeVariation, initialScale?: number): Result<EditingSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseRecipe</td><td>IFillingRecipeVariation</td><td>Source recipe version to edit</td></tr>
<tr><td>initialScale</td><td>number</td><td>Optional initial scale factor (default: 1.0)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditingSession](EditingSession.md)&gt;

Result with new EditingSession or error
