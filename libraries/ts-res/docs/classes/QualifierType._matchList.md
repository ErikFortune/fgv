[Home](../README.md) > [QualifierType](./QualifierType.md) > _matchList

## QualifierType._matchList() method

Matches a single condition value against a list of context values.

**Signature:**

```typescript
_matchList(condition: QualifierConditionValue, context: QualifierContextValue[], operator: ConditionOperator): QualifierMatchScore;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>condition</td><td>QualifierConditionValue</td><td>The QualifierConditionValue | condition value to match.</td></tr>
<tr><td>context</td><td>QualifierContextValue[]</td><td>The comma-separated list of QualifierContextValue | context values to match.</td></tr>
<tr><td>operator</td><td>ConditionOperator</td><td>The ConditionOperator | operator to use in the match.</td></tr>
</tbody></table>

**Returns:**

[QualifierMatchScore](../type-aliases/QualifierMatchScore.md)

a QualifierMatchScore | score indicating the extent to which
the condition matches the context value.
