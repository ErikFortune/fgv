[Home](../../README.md) > [Qualifiers](../README.md) > [QualifierDefaultValueTokens](./QualifierDefaultValueTokens.md) > declToQualifierDefaultValuesToken

## QualifierDefaultValueTokens.declToQualifierDefaultValuesToken() method

Converts a validated qualifier default values declaration to a QualifierDefaultValuesToken | qualifier default values token.

**Signature:**

```typescript
declToQualifierDefaultValuesToken(decl: IValidatedQualifierDefaultValuesDecl): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>IValidatedQualifierDefaultValuesDecl</td><td>the validated qualifier default values declaration to convert</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

`Success` with the qualifier default values token if successful, `Failure` with an error message if not.
