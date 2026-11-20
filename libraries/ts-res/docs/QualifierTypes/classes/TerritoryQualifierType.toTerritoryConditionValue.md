[Home](../../README.md) > [QualifierTypes](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > toTerritoryConditionValue

## TerritoryQualifierType.toTerritoryConditionValue() method

Converts a string value to a territory condition value.

**Signature:**

```typescript
static toTerritoryConditionValue(value: string, acceptLowercase?: boolean): Result<QualifierConditionValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>The value to convert.</td></tr>
<tr><td>acceptLowercase</td><td>boolean</td><td>Flag indicating whether the qualifier type should accept lowercase territory codes.
Defaults to `false`.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierConditionValue](../../type-aliases/QualifierConditionValue.md)&gt;

`Success` with the converted value if successful, `Failure` with an error
message otherwise.
