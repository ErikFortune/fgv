[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > [ConfectionEditingSessionBase](./ConfectionEditingSessionBase.md) > getFillingSession

## ConfectionEditingSessionBase.getFillingSession() method

Gets the filling session for a specific slot.

**Signature:**

```typescript
getFillingSession(slotId: SlotId): EditingSession | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>slotId</td><td>SlotId</td><td>The slot identifier</td></tr>
</tbody></table>

**Returns:**

[EditingSession](../../../classes/EditingSession.md) | undefined

The editing session, or undefined if not found
