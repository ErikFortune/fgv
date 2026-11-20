[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > resolveCondition

## ResourceResolver.resolveCondition() method

Resolves a condition by evaluating it against the current context.
Uses O(1) caching based on the condition's globally unique sequential index.

**Signature:**

```typescript
resolveCondition(condition: Condition): Result<IConditionMatchResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>condition</td><td>Condition</td><td>The Conditions.Condition | condition to resolve.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IConditionMatchResult](../interfaces/IConditionMatchResult.md)&gt;

`Success` with the QualifierMatchScore | match score if successful,
or `Failure` with an error message if the condition cannot be resolved.
