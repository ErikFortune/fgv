[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipeQuery](./FillingRecipeQuery.md) > ganacheFatContent

## FillingRecipeQuery.ganacheFatContent() method

Filter by ganache fat content range.
Note: Calculates ganache for each recipe, which may be slow for large sets.

**Signature:**

```typescript
ganacheFatContent(min: Percentage, max?: Percentage): FillingRecipeQuery;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>min</td><td>Percentage</td><td>Minimum fat percentage</td></tr>
<tr><td>max</td><td>Percentage</td><td>Optional maximum fat percentage</td></tr>
</tbody></table>

**Returns:**

[FillingRecipeQuery](../../classes/FillingRecipeQuery.md)
