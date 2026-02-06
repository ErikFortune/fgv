[Home](../../README.md) > [LibraryRuntime](../README.md) > [BarTruffleVersion](./BarTruffleVersion.md) > create

## BarTruffleVersion.create() method

Factory method for creating a LibraryRuntime.BarTruffleRecipeVariation | BarTruffleRecipeVariation.

**Signature:**

```typescript
static create(context: IConfectionContext, confectionId: ConfectionId, variation: IBarTruffleRecipeVariationEntity): Result<BarTruffleVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>confectionId</td><td>ConfectionId</td><td>The parent confection ID</td></tr>
<tr><td>variation</td><td>IBarTruffleRecipeVariationEntity</td><td>The bar truffle variation data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BarTruffleVersion](../../classes/BarTruffleVersion.md)&gt;

Success with LibraryRuntime.BarTruffleRecipeVariation | BarTruffleRecipeVariation
