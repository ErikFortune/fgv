[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > resolveConditionSet

## ResourceResolver.resolveConditionSet() method

Resolves a condition set by evaluating all its constituent conditions against the current context.
Uses O(1) caching based on the condition set's globally unique sequential index.

**Signature:**

```typescript
resolveConditionSet(conditionSet: ConditionSet): Result<ConditionSetResolutionResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>conditionSet</td><td>ConditionSet</td><td>The Conditions.ConditionSet | condition set to resolve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSetResolutionResult](ConditionSetResolutionResult.md)&gt;

`Success` with the Runtime.ConditionSetResolutionResult | resolution result if successful,
or `Failure` with an error message if the condition set cannot be resolved.
