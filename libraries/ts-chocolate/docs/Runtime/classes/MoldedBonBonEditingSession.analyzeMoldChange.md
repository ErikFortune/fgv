[Home](../../README.md) > [Runtime](../README.md) > [MoldedBonBonEditingSession](./MoldedBonBonEditingSession.md) > analyzeMoldChange

## MoldedBonBonEditingSession.analyzeMoldChange() method

Analyzes impact of changing to a new mold.
Returns analysis for user review before confirmation.

**Signature:**

```typescript
analyzeMoldChange(moldId: MoldId): Result<IMoldChangeAnalysis>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>moldId</td><td>MoldId</td><td>The new mold ID</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IMoldChangeAnalysis](../../interfaces/IMoldChangeAnalysis.md)&gt;

Success with analysis, or Failure if mold not found
