[Home](../../README.md) > [LibraryRuntime](../README.md) > [BarTruffle](./BarTruffle.md) > create

## BarTruffle.create() method

Factory method for creating a BarTruffle.

**Signature:**

```typescript
static create(context: IConfectionContext, id: ConfectionId, confection: IBarTruffleEntity): Result<BarTruffle>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>id</td><td>ConfectionId</td><td>The confection ID</td></tr>
<tr><td>confection</td><td>IBarTruffleEntity</td><td>The bar truffle data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BarTruffle](../../classes/BarTruffle.md)&gt;

Success with BarTruffle
