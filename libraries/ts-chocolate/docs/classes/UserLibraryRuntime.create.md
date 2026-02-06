[Home](../README.md) > [UserLibraryRuntime](./UserLibraryRuntime.md) > create

## UserLibraryRuntime.create() method

Creates a new UserLibraryRuntime.

**Signature:**

```typescript
static create(userEntityLibrary: IUserEntityLibrary, sessionContext: ISessionContext): Result<UserLibraryRuntime>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>userEntityLibrary</td><td>IUserEntityLibrary</td><td>The user library containing persisted data</td></tr>
<tr><td>sessionContext</td><td>ISessionContext</td><td>The session context for materializing recipes and confections</td></tr>
</tbody></table>

**Returns:**

Result&lt;[UserLibraryRuntime](UserLibraryRuntime.md)&gt;

Result with the UserLibraryRuntime
