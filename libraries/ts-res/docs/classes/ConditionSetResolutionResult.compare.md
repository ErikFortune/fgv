[Home](../README.md) > [ConditionSetResolutionResult](./ConditionSetResolutionResult.md) > compare

## ConditionSetResolutionResult.compare() method

Compares two condition set resolution results for sorting purposes.
The priority of a condition set result cannot be boiled down to a single number -
we have to examine each condition result in turn.

Comparison logic:
- If priority differs, return the higher priority
- If priority matches but score is different, return the higher score
- If priority and score both match, proceed to the next condition
- Failed results are considered lower priority than successful results

**Signature:**

```typescript
static compare(a: ConditionSetResolutionResult, b: ConditionSetResolutionResult): number;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>a</td><td>ConditionSetResolutionResult</td><td>The first condition set resolution result to compare.</td></tr>
<tr><td>b</td><td>ConditionSetResolutionResult</td><td>The second condition set resolution result to compare.</td></tr>
</tbody></table>

**Returns:**

number

A negative number if a should come before b, a positive number if a should
come after b, or zero if they are equivalent.
