[Home](../../README.md) > [Runtime](../README.md) > [ConditionSetResolutionResult](./ConditionSetResolutionResult.md) > create

## ConditionSetResolutionResult.create() method

Creates a new condition set resolution result.

**Signature:**

```typescript
static create(matchType: ConditionMatchType, matches: readonly IConditionMatchResult[]): Result<ConditionSetResolutionResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>matchType</td><td>ConditionMatchType</td><td>The type of match.</td></tr>
<tr><td>matches</td><td>readonly IConditionMatchResult[]</td><td>Array of condition match results.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSetResolutionResult](../../classes/ConditionSetResolutionResult.md)&gt;

A new Runtime.ConditionSetResolutionResult | ConditionSetResolutionResult.
