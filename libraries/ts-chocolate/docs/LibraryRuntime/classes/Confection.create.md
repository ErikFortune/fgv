[Home](../../README.md) > [LibraryRuntime](../README.md) > [Confection](./Confection.md) > create

## Confection.create() method

Factory method that auto-detects confection type and returns appropriate concrete class.

**Signature:**

```typescript
static create(context: IConfectionContext, id: ConfectionId, confection: AnyConfectionRecipeEntity): Result<AnyConfection>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context for navigation</td></tr>
<tr><td>id</td><td>ConfectionId</td><td>The confection ID</td></tr>
<tr><td>confection</td><td>AnyConfectionRecipeEntity</td><td>The confection data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AnyConfection](../../type-aliases/AnyConfection.md)&gt;

Success with the appropriate concrete Confection subclass, or Failure for unknown type
