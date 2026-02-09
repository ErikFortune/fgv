[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [RolledTruffleEditingSession](./RolledTruffleEditingSession.md) > create

## RolledTruffleEditingSession.create() method

Factory method for creating a RolledTruffleEditingSession.

**Signature:**

```typescript
static create(baseConfection: T, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<RolledTruffleEditingSession<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>T</td><td>The source rolled truffle confection</td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[RolledTruffleEditingSession](../../../classes/RolledTruffleEditingSession.md)&lt;T&gt;&gt;

Success with RolledTruffleEditingSession, or Failure
