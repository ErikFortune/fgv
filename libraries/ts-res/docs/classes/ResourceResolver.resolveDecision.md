[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > resolveDecision

## ResourceResolver.resolveDecision() method

Resolves a decision by evaluating all its constituent condition sets against the current context.
Uses O(1) caching based on the decision's globally unique sequential index.

**Signature:**

```typescript
resolveDecision(decision: AbstractDecision): Result<DecisionResolutionResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decision</td><td>AbstractDecision</td><td>The Decisions.AbstractDecision | abstract decision to resolve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[DecisionResolutionResult](../type-aliases/DecisionResolutionResult.md)&gt;

`Success` with the Runtime.DecisionResolutionResult | resolution result if successful,
or `Failure` with an error message if the decision cannot be resolved.
