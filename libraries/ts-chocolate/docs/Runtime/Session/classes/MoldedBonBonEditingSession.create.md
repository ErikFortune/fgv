[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > create

## MoldedBonBonEditingSession.create() method

Factory method for creating a MoldedBonBonEditingSession.

**Signature:**

```typescript
static create(baseConfection: MoldedBonBonRecipe, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<MoldedBonBonEditingSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>MoldedBonBonRecipe</td><td>The source molded bonbon confection</td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldedBonBonEditingSession](../../../classes/MoldedBonBonEditingSession.md)&gt;

Success with MoldedBonBonEditingSession, or Failure
