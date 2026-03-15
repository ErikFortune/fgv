[Home](../../README.md) > [LibraryRuntime](../README.md) > [MoldedBonBonRecipeVariation](./MoldedBonBonRecipeVariation.md) > create

## MoldedBonBonRecipeVariation.create() method

Factory method for creating a MoldedBonBonRecipeVariation.

**Signature:**

```typescript
static create(context: IConfectionContext, confectionId: ConfectionId, variation: IMoldedBonBonRecipeVariationEntity): Result<MoldedBonBonRecipeVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>confectionId</td><td>ConfectionId</td><td>The parent confection ID</td></tr>
<tr><td>variation</td><td>IMoldedBonBonRecipeVariationEntity</td><td>The molded bonbon variation data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldedBonBonRecipeVariation](../../classes/MoldedBonBonRecipeVariation.md)&gt;

Success with MoldedBonBonRecipeVariation
