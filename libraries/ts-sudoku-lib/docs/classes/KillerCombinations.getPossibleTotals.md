[Home](../README.md) > [KillerCombinations](./KillerCombinations.md) > getPossibleTotals

## KillerCombinations.getPossibleTotals() method

Gets all mathematically possible totals for a given cage size.

Uses the existing totalsByCageSize constant to determine the valid range
of totals for the specified cage size and returns all integers in that range.

**Signature:**

```typescript
static getPossibleTotals(cageSize: number, maxValue: number): Result<number[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cageSize</td><td>number</td><td>The number of cells in the cage (must be 1-9)</td></tr>
<tr><td>maxValue</td><td>number</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;number[]&gt;

Result containing array of possible totals in ascending order
