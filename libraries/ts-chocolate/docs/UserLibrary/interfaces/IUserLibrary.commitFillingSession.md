[Home](../../README.md) > [UserLibrary](../README.md) > [IUserLibrary](./IUserLibrary.md) > commitFillingSession

## IUserLibrary.commitFillingSession() method

Commits a filling session to the journal.
Creates a journal entry (edit or production based on execution state),
persists it, and updates the session status to 'committed'.

**Signature:**

```typescript
commitFillingSession(sessionId: SessionId, journalCollectionId: CollectionId): Promise<Result<ICommitResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>sessionId</td><td>SessionId</td><td>Session to commit</td></tr>
<tr><td>journalCollectionId</td><td>CollectionId</td><td>Target collection for the journal entry</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[ICommitResult](../../interfaces/ICommitResult.md)&gt;&gt;

Promise with Result containing commit result (journalId + saveAnalysis)
