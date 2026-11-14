[Home](../README.md) > [QualifierDefaultValueTokens](./QualifierDefaultValueTokens.md) > parseQualifierDefaultValueToken

## QualifierDefaultValueTokens.parseQualifierDefaultValueToken() method

Parses a QualifierDefaultValueToken | qualifier default value token string and validates the parts
against the qualifiers present in the Qualifiers.QualifierDefaultValueTokens.qualifiers | qualifier collector.

**Signature:**

```typescript
parseQualifierDefaultValueToken(token: string): Result<IValidatedQualifierDefaultValueDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the token string to parse.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedQualifierDefaultValueDecl](../interfaces/IValidatedQualifierDefaultValueDecl.md)&gt;

`Success` with the Qualifiers.IValidatedQualifierDefaultValueDecl | validated qualifier default value declaration
if successful, `Failure` with an error message if not.
