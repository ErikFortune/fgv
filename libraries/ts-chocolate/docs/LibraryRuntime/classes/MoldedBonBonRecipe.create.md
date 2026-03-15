[Home](../../README.md) > [LibraryRuntime](../README.md) > [MoldedBonBonRecipe](./MoldedBonBonRecipe.md) > create

## MoldedBonBonRecipe.create() method

Factory method for creating a MoldedBonBon.

**Signature:**

```typescript
static create(context: IConfectionContext, id: ConfectionId, confection: MoldedBonBonRecipeEntity): Result<MoldedBonBonRecipe>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>ConfectionId</td><td>The confection ID</td></tr>
<tr><td>confection</td><td>MoldedBonBonRecipeEntity</td><td>The molded bonbon data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldedBonBonRecipe](../../classes/MoldedBonBonRecipe.md)&gt;

Success with MoldedBonBon
