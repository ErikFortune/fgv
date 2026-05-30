[Home](../README.md) > [TerritoryQualifierType](./TerritoryQualifierType.md) > isValidTerritoryConditionValue

## TerritoryQualifierType.isValidTerritoryConditionValue() method

Determines whether a value is a valid condition value for a territory qualifier.

**Signature:**

```typescript
static isValidTerritoryConditionValue(value: string, acceptLowercase?: boolean): value is QualifierConditionValue;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>value</td><td>string</td><td>The value to validate.</td></tr>
<tr><td>acceptLowercase</td><td>boolean</td><td>Flag indicating whether the qualifier type should accept lowercase territory codes.
Defaults to `false`.</td></tr>
</tbody></table>

**Returns:**

value is [QualifierConditionValue](../type-aliases/QualifierConditionValue.md)

`true` if the value is a valid condition value, `false` otherwise.
