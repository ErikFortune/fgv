[Home](../README.md) > [PuzzleSession](./PuzzleSession.md) > cageContainedValues

## PuzzleSession.cageContainedValues() method

Determines the numbers currently present in some cage.

**Signature:**

```typescript
cageContainedValues(spec: string | ICage): Set<number>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>spec</td><td>string | ICage</td><td>A `string` (CageId | CageId) or ICage | ICage
indicating the cage to be tested.</td></tr>
</tbody></table>

**Returns:**

Set&lt;number&gt;

A `Set<number>` containing all numbers present in the cage.
