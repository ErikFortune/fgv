[Home](../../README.md) > [LibraryRuntime](../README.md) > [RolledTruffleRecipeVariation](./RolledTruffleRecipeVariation.md) > create

## RolledTruffleRecipeVariation.create() method

Factory method for creating a LibraryRuntime.Confections.RolledTruffleRecipeVariation.

**Signature:**

```typescript
static create(context: IConfectionContext, confectionId: ConfectionId, variation: IRolledTruffleRecipeVariationEntity): Result<RolledTruffleRecipeVariation>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>confectionId</td><td>ConfectionId</td><td>The parent confection ID</td></tr>
<tr><td>variation</td><td>IRolledTruffleRecipeVariationEntity</td><td>The rolled truffle variation data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[RolledTruffleRecipeVariation](../../classes/RolledTruffleRecipeVariation.md)&gt;

Success with LibraryRuntime.Confections.RolledTruffleRecipeVariation
