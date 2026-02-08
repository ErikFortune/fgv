[Home](../README.md) > [ISettingsManager](./ISettingsManager.md) > updateLastActiveSessionId

## ISettingsManager.updateLastActiveSessionId() method

Updates the last active session ID for this device (convenience method).

**Signature:**

```typescript
updateLastActiveSessionId(sessionId: string | undefined): Result<string | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>string | undefined</td><td>The session ID, or undefined to clear</td></tr>
</tbody></table>

**Returns:**

Result&lt;string | undefined&gt;

Success with the updated session ID, or Failure
