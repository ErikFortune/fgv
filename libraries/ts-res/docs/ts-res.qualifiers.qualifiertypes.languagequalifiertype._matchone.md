<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Qualifiers](./ts-res.qualifiers.md) &gt; [QualifierTypes](./ts-res.qualifiers.qualifiertypes.md) &gt; [LanguageQualifierType](./ts-res.qualifiers.qualifiertypes.languagequalifiertype.md) &gt; [\_matchOne](./ts-res.qualifiers.qualifiertypes.languagequalifiertype._matchone.md)

## Qualifiers.QualifierTypes.LanguageQualifierType.\_matchOne() method

Matches a single language condition against a single language context value using [similarity matching](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47#tag-matching)<!-- -->.

**Signature:**

```typescript
protected _matchOne(condition: QualifierConditionValue, context: QualifierContextValue, operator: ConditionOperator): QualifierMatchScore;
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

The language condition value to match.


</td></tr>
<tr><td>

context


</td><td>

[QualifierContextValue](./ts-res.qualifiercontextvalue.md)


</td><td>

The language context value to match against.


</td></tr>
<tr><td>

operator


</td><td>

[ConditionOperator](./ts-res.conditionoperator.md)


</td><td>

The operator to use for the match. Must be 'matches'.


</td></tr>
</tbody></table>
**Returns:**

[QualifierMatchScore](./ts-res.qualifiermatchscore.md)

- The match score, or `noMatch` if the match fails.
