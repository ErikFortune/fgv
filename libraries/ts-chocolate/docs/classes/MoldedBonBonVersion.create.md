[Home](../README.md) > [MoldedBonBonVersion](./MoldedBonBonVersion.md) > create

## MoldedBonBonVersion.create() method

Factory method for creating a MoldedBonBonVersion.

**Signature:**

```typescript
static create(context: IConfectionContext, confectionId: ConfectionId, version: IMoldedBonBonVersionEntity): Result<MoldedBonBonVersion>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IConfectionContext</td><td>The runtime context</td></tr>
<tr><td>confectionId</td><td>ConfectionId</td><td>The parent confection ID</td></tr>
<tr><td>version</td><td>IMoldedBonBonVersionEntity</td><td>The molded bonbon version data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldedBonBonVersion](MoldedBonBonVersion.md)&gt;

Success with MoldedBonBonVersion
