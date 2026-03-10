[Home](../../README.md) > [UserLibrary](../README.md) > [UserLibrary](./UserLibrary.md) > commitConfectionSession

## UserLibrary.commitConfectionSession() method

Commits a confection session to the journal.
Creates a production journal entry with the produced confection state
(including embedded filling snapshots), persists it, and updates the
session status to 'committed'.

**Signature:**

```typescript
commitConfectionSession(sessionId: SessionId, journalCollectionId: CollectionId): Promise<Result<ICommitResult>>;
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
