[Home](../../README.md) > [QualifierTypes](../README.md) > [LiteralQualifierType](./LiteralQualifierType.md) > isValidConditionValue

## LiteralQualifierType.isValidConditionValue() method

Determines whether a value is a valid condition value for a literal qualifier.
The QualifierTypes.LiteralQualifierType | LiteralQualifierType accepts
any identifier as a valid condition value.

**Signature:**

```typescript
isValidConditionValue(value: string): value is QualifierConditionValue;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>The value to validate.</td></tr>
</tbody></table>

**Returns:**

value is [QualifierConditionValue](../../type-aliases/QualifierConditionValue.md)

`true` if the value is a valid condition value, `false` otherwise.
