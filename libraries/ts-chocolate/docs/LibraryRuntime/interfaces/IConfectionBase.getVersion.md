[Home](../../README.md) > [LibraryRuntime](../README.md) > [IConfectionBase](./IConfectionBase.md) > getVersion

## IConfectionBase.getVersion() method

Gets a specific version by version specifier.

**Signature:**

```typescript
getVersion(versionSpec: ConfectionRecipeVariationSpec): Result<TVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>versionSpec</td><td>ConfectionRecipeVariationSpec</td><td>The version specifier to find</td></tr>
</tbody></table>

**Returns:**

Result&lt;TVersion&gt;

Success with runtime version, or Failure if not found
