[Home](../README.md) > [ConfectionEditingSessionBase](./ConfectionEditingSessionBase.md) > removeFillingSlot

## ConfectionEditingSessionBase.removeFillingSlot() method

Removes a filling slot.

**Signature:**

```typescript
removeFillingSlot(slotId: SlotId): Result<EditingSession | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>slotId</td><td>SlotId</td><td>The slot identifier</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditingSession](EditingSession.md) | undefined&gt;

`Success` with the removed filling session, or `undefined` if none existed; or `Failure`
