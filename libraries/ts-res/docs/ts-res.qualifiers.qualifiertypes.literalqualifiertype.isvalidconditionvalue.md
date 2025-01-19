<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Qualifiers](./ts-res.qualifiers.md) &gt; [QualifierTypes](./ts-res.qualifiers.qualifiertypes.md) &gt; [LiteralQualifierType](./ts-res.qualifiers.qualifiertypes.literalqualifiertype.md) &gt; [isValidConditionValue](./ts-res.qualifiers.qualifiertypes.literalqualifiertype.isvalidconditionvalue.md)

## Qualifiers.QualifierTypes.LiteralQualifierType.isValidConditionValue() method

Determines whether a value is a valid condition value for a literal qualifier. The [LiteralQualifierType](./ts-res.qualifiers.qualifiertypes.literalqualifiertype.md) accepts any identifier as a valid condition value.

**Signature:**

```typescript
isValidConditionValue(value: string): value is QualifierConditionValue;
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

value


</td><td>

string


</td><td>

The value to validate.


</td></tr>
</tbody></table>
**Returns:**

value is [QualifierConditionValue](./ts-res.qualifierconditionvalue.md)

`true` if the value is a valid condition value, `false` otherwise.
