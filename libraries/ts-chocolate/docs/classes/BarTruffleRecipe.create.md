[Home](../README.md) > [BarTruffleRecipe](./BarTruffleRecipe.md) > create

## BarTruffleRecipe.create() method

Factory method for creating a BarTruffle.

**Signature:**

```typescript
static create(context: IConfectionContext, id: ConfectionId, confection: BarTruffleRecipeEntity): Result<BarTruffleRecipe>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>ConfectionId</td><td>The confection ID</td></tr>
<tr><td>confection</td><td>BarTruffleRecipeEntity</td><td>The bar truffle data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BarTruffleRecipe](BarTruffleRecipe.md)&gt;

Success with BarTruffle
