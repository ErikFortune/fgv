[Home](../README.md) > [IFillingRecipe](./IFillingRecipe.md) > getVersion

## IFillingRecipe.getVersion() method

Gets a specific version by FillingRecipeVariationSpec | version specifier.

**Signature:**

```typescript
getVersion(versionSpec: FillingRecipeVariationSpec): Result<IFillingRecipeVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionSpec</td><td>FillingRecipeVariationSpec</td><td>The version specifier to find</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IFillingRecipeVersion](IFillingRecipeVersion.md)&gt;

Success with RuntimeFillingRecipeVersion, or Failure if not found
