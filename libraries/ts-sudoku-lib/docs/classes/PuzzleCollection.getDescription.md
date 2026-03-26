[Home](../README.md) > [PuzzleCollection](./PuzzleCollection.md) > getDescription

## PuzzleCollection.getDescription() method

Gets a puzzle by id from this collection.

**Signature:**

```typescript
getDescription(id: string): Result<IPuzzleFileData>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>id</td><td>string</td><td>The string ID of the puzzle to be returned.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IPuzzleFileData](../interfaces/IPuzzleFileData.md)&gt;

`Success` with the requested PuzzleSession | puzzle, or
`Failure` with details if an error occurs.
