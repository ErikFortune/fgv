[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [ConfectionEditingSession](./ConfectionEditingSession.md) > create

## ConfectionEditingSession.create() method

Creates a confection editing session for the appropriate confection type.
Dispatches to type-specific session classes:
- MoldedBonBonEditingSession for molded bonbons (frame-based yield)
- BarTruffleEditingSession for bar truffles (linear scaling)
- RolledTruffleEditingSession for rolled truffles (linear scaling)

**Signature:**

```typescript
static create(baseConfection: T, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<AnyConfectionEditingSession>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>T</td><td>The source confection to edit</td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context for resource access</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters (sessionId, initialYield)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[AnyConfectionEditingSession](../../../type-aliases/AnyConfectionEditingSession.md)&gt;

Success with type-specific session, or Failure
