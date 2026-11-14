[Home](../README.md) > [Decision](./Decision.md) > getKey

## Decision.getKey() method

Helper function to return a stable key for a set of condition sets.

**Signature:**

```typescript
static getKey(candidates: readonly ICandidate<TVALUE>[]): DecisionKey;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>candidates</td><td>readonly ICandidate&lt;TVALUE&gt;[]</td><td>The candidates whose condition sets are used to create the key.</td></tr>
</tbody></table>

**Returns:**

[DecisionKey](../type-aliases/DecisionKey.md)

A key derived from the condition set hashes.
