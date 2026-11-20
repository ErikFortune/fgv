[Home](../README.md) > [Decision](./Decision.md) > getAbstractKey

## Decision.getAbstractKey() method

Helper function to return a stable key for a the condition sets that
make up a Decisions.Decision | decision.  The abstract
key is a `+`-separated list of the hashes of the sorted condition sets
that make up the decision.

**Signature:**

```typescript
static getAbstractKey(conditionSets: readonly ConditionSet[]): DecisionKey;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>conditionSets</td><td>readonly ConditionSet[]</td><td>The condition sets to use to create the key.</td></tr>
</tbody></table>

**Returns:**

[DecisionKey](../type-aliases/DecisionKey.md)

A key derived from the condition set hashes.
