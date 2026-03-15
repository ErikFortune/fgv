[Home](../../README.md) > [UserLibrary](../README.md) > [BarTruffleEditingSession](./BarTruffleEditingSession.md) > create

## BarTruffleEditingSession.create() method

Factory method for creating a BarTruffleEditingSession.

**Signature:**

```typescript
static create(baseConfection: T, context: ISessionContext, params?: IConfectionEditingSessionParams): Result<BarTruffleEditingSession<T>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseConfection</td><td>T</td><td>The source bar truffle confection</td></tr>
<tr><td>context</td><td>ISessionContext</td><td>The runtime context</td></tr>
<tr><td>params</td><td>IConfectionEditingSessionParams</td><td>Optional session parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BarTruffleEditingSession](../../classes/BarTruffleEditingSession.md)&lt;T&gt;&gt;

Success with BarTruffleEditingSession, or Failure
