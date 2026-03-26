[Home](../README.md) > [LiteralQualifierType](./LiteralQualifierType.md) > toLiteralConditionValue

## LiteralQualifierType.toLiteralConditionValue() method

Converts a string to a QualifierConditionValue | literal condition value.

**Signature:**

```typescript
static toLiteralConditionValue(from: string): Result<QualifierConditionValue>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>string</td><td>The string to convert.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[QualifierConditionValue](../type-aliases/QualifierConditionValue.md)&gt;

`Success` with the converted value if valid, or `Failure` with an error
message if not.
