[Home](../README.md) > [RolledTruffleRecipe](./RolledTruffleRecipe.md) > create

## RolledTruffleRecipe.create() method

Factory method for creating a RolledTruffle.

**Signature:**

```typescript
static create(context: IConfectionContext, id: ConfectionId, confection: RolledTruffleRecipeEntity): Result<RolledTruffleRecipe>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>ConfectionId</td><td>The confection ID</td></tr>
<tr><td>confection</td><td>RolledTruffleRecipeEntity</td><td>The rolled truffle data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[RolledTruffleRecipe](RolledTruffleRecipe.md)&gt;

Success with RolledTruffle
