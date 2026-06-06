[Home](../../README.md) > [Puzzles](../README.md) > [KillerCombinations](./KillerCombinations.md) > getCombinations

## KillerCombinations.getCombinations() method

Generates all possible number combinations that sum to the target total.

Each combination contains unique numbers from 1-9 that sum exactly to the
specified total. Combinations respect both excluded and required number
constraints if provided.

**Signature:**

```typescript
static getCombinations(cageSize: number, total: number, constraints?: IKillerConstraints, maxValue: number): Result<number[][]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cageSize</td><td>number</td><td>The number of cells in the cage (must be 1-9)</td></tr>
<tr><td>total</td><td>number</td><td>The target sum (must be valid for the cage size)</td></tr>
<tr><td>constraints</td><td>IKillerConstraints</td><td>Optional constraints on included/excluded numbers</td></tr>
<tr><td>maxValue</td><td>number</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;number[][]&gt;

Result containing array of combinations, each sorted in ascending order
