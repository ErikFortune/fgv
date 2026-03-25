[Home](../../README.md) > [Qualifiers](../README.md) > [QualifierDefaultValueTokens](./QualifierDefaultValueTokens.md) > parseQualifierDefaultValuesToken

## QualifierDefaultValueTokens.parseQualifierDefaultValuesToken() method

Parses a QualifierDefaultValuesToken | qualifier default values token string and validates the parts
against the qualifiers present in the Qualifiers.QualifierDefaultValueTokens.qualifiers | qualifier collector.

**Signature:**

```typescript
parseQualifierDefaultValuesToken(token: string): Result<IValidatedQualifierDefaultValueDecl[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the token string to parse.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedQualifierDefaultValueDecl](../../interfaces/IValidatedQualifierDefaultValueDecl.md)[]&gt;

`Success` with the array of Qualifiers.IValidatedQualifierDefaultValueDecl | validated qualifier default value declarations
if successful, `Failure` with an error message if not.
