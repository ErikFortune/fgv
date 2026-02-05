[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > getVersion

## FillingRecipe.getVersion() method

Gets a specific version by ID.

**Signature:**

```typescript
getVersion(versionSpec: FillingRecipeVariationSpec): Result<FillingRecipeVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionSpec</td><td>FillingRecipeVariationSpec</td><td>The version ID to find</td></tr>
</tbody></table>

**Returns:**

Result&lt;[FillingRecipeVersion](../../classes/FillingRecipeVersion.md)&gt;

Success with FillingRecipeVersion, or Failure if not found
