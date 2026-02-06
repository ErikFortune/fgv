[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > create

## UserLibrary.create() method

Creates a new UserLibrary.

**Signature:**

```typescript
static create(userEntityLibrary: IUserEntityLibrary, sessionContext: ISessionContext): Result<UserLibrary>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>userEntityLibrary</td><td>IUserEntityLibrary</td><td>The user library containing persisted data</td></tr>
<tr><td>sessionContext</td><td>ISessionContext</td><td>The session context for materializing recipes and confections</td></tr>
</tbody></table>

**Returns:**

Result&lt;[UserLibrary](../../classes/UserLibrary.md)&gt;

Result with the UserLibrary
