[Home](../README.md) > [IUserLibrary](./IUserLibrary.md) > createPersistedConfectionSessionAndSave

## IUserLibrary.createPersistedConfectionSessionAndSave() method

Creates and persists a new confection session in one orchestrated operation.
Persists to backing storage when supported by the target collection.

**Signature:**

```typescript
createPersistedConfectionSessionAndSave(confectionId: ConfectionId, options: ICreateConfectionSessionOptions): Promise<Result<SessionId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>confectionId</td><td>ConfectionId</td><td>Source confection to create session for</td></tr>
<tr><td>options</td><td>ICreateConfectionSessionOptions</td><td>Creation options including target collection and optional session params</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[SessionId](../type-aliases/SessionId.md)&gt;&gt;

Promise with Result containing the composite SessionId
