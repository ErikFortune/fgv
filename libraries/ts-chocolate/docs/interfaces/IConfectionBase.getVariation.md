[Home](../README.md) > [IConfectionBase](./IConfectionBase.md) > getVariation

## IConfectionBase.getVariation() method

Gets a specific variation by variation specifier.

**Signature:**

```typescript
getVariation(variationSpec: ConfectionRecipeVariationSpec): Result<TVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>variationSpec</td><td>ConfectionRecipeVariationSpec</td><td>The variation specifier to find</td></tr>
</tbody></table>

**Returns:**

Result&lt;TVariation&gt;

Success with runtime variation, or Failure if not found
