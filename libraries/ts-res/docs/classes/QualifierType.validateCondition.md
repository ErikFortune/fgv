[Home](../README.md) > [QualifierType](./QualifierType.md) > validateCondition

## QualifierType.validateCondition() method

Validates that a value and optional operator are valid for use in a condition
for qualifiers of this type.

**Signature:**

```typescript
validateCondition(value: string, operator?: ConditionOperator): Result<QualifierConditionValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>The string value to validate.</td></tr>
<tr><td>operator</td><td>ConditionOperator</td><td>An optional operator to validate. Defaults to 'matches'.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierConditionValue](../type-aliases/QualifierConditionValue.md)&gt;
