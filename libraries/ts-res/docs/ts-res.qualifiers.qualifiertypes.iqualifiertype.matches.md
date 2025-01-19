<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Qualifiers](./ts-res.qualifiers.md) &gt; [QualifierTypes](./ts-res.qualifiers.qualifiertypes.md) &gt; [IQualifierType](./ts-res.qualifiers.qualifiertypes.iqualifiertype.md) &gt; [matches](./ts-res.qualifiers.qualifiertypes.iqualifiertype.matches.md)

## Qualifiers.QualifierTypes.IQualifierType.matches() method

Determines the extent to which a condition matches a context value for this qualifier type.

**Signature:**

```typescript
matches(condition: QualifierConditionValue, context: QualifierContextValue, operator: ConditionOperator): QualifierMatchScore;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

condition


</td><td>

[QualifierConditionValue](./ts-res.qualifierconditionvalue.md)


</td><td>

The condition value to evaluate.


</td></tr>
<tr><td>

context


</td><td>

[QualifierContextValue](./ts-res.qualifiercontextvalue.md)


</td><td>

The context value to evaluate.


</td></tr>
<tr><td>

operator


</td><td>

[ConditionOperator](./ts-res.conditionoperator.md)


</td><td>

The operator to use in evaluating the match.


</td></tr>
</tbody></table>
**Returns:**

[QualifierMatchScore](./ts-res.qualifiermatchscore.md)

a [score](./ts-res.qualifiermatchscore.md) indicating the extent to which the condition matches the context value.
