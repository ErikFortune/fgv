[Home](../README.md) > [IQualifierType](./IQualifierType.md) > matches

## IQualifierType.matches() method

Determines the extent to which a condition matches a context value for this
qualifier type.

**Signature:**

```typescript
matches(condition: QualifierConditionValue, context: QualifierContextValue, operator: ConditionOperator): QualifierMatchScore;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>condition</td><td>QualifierConditionValue</td><td>The condition value to evaluate.</td></tr>
<tr><td>context</td><td>QualifierContextValue</td><td>The context value to evaluate.</td></tr>
<tr><td>operator</td><td>ConditionOperator</td><td>The operator to use in evaluating the match.</td></tr>
</tbody></table>

**Returns:**

[QualifierMatchScore](../type-aliases/QualifierMatchScore.md)

a QualifierMatchScore | score indicating the extent to which
the condition matches the context value.
