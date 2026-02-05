[Home](../README.md) > [Mold](./Mold.md) > create

## Mold.create() method

Factory method for creating a Mold.

**Signature:**

```typescript
static create(context: IMoldContext, id: MoldId, mold: IMoldEntity): Result<Mold>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IMoldContext</td><td>The runtime context (reserved for future use)</td></tr>
<tr><td>id</td><td>MoldId</td><td>The composite mold ID</td></tr>
<tr><td>mold</td><td>IMoldEntity</td><td>The mold data</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Mold](Mold.md)&gt;

Success with Mold
