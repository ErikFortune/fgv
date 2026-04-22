[Home](../../README.md) > [QualifierTypes](../README.md) > [LanguageQualifierType](./LanguageQualifierType.md) > isValidConditionValue

## LanguageQualifierType.isValidConditionValue() method

Validates a condition value for this qualifier type.

**Signature:**

```typescript
isValidConditionValue(value: string): value is QualifierConditionValue;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>The string value to validate.</td></tr>
</tbody></table>

**Returns:**

value is [QualifierConditionValue](../../type-aliases/QualifierConditionValue.md)

`Success` with the QualifierConditionValue | validated value
if the value is valid for use in a condition, `Failure` with error details
otherwise.
