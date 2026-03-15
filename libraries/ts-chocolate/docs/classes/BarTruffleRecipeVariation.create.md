[Home](../README.md) > [BarTruffleRecipeVariation](./BarTruffleRecipeVariation.md) > create

## BarTruffleRecipeVariation.create() method

Factory method for creating a LibraryRuntime.BarTruffleRecipeVariation | BarTruffleRecipeVariation.

**Signature:**

```typescript
static create(context: IConfectionContext, confectionId: ConfectionId, variation: IBarTruffleRecipeVariationEntity): Result<BarTruffleRecipeVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>confectionId</td><td>ConfectionId</td><td>The parent confection ID</td></tr>
<tr><td>variation</td><td>IBarTruffleRecipeVariationEntity</td><td>The bar truffle variation data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BarTruffleRecipeVariation](BarTruffleRecipeVariation.md)&gt;

Success with LibraryRuntime.BarTruffleRecipeVariation | BarTruffleRecipeVariation
