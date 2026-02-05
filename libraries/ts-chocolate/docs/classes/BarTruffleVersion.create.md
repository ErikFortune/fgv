[Home](../README.md) > [BarTruffleVersion](./BarTruffleVersion.md) > create

## BarTruffleVersion.create() method

Factory method for creating a LibraryRuntime.BarTruffleVersion | BarTruffleVersion.

**Signature:**

```typescript
static create(context: IConfectionContext, confectionId: ConfectionId, version: IBarTruffleVersionEntity): Result<BarTruffleVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>confectionId</td><td>ConfectionId</td><td>The parent confection ID</td></tr>
<tr><td>version</td><td>IBarTruffleVersionEntity</td><td>The bar truffle version data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BarTruffleVersion](BarTruffleVersion.md)&gt;

Success with LibraryRuntime.BarTruffleVersion | BarTruffleVersion
