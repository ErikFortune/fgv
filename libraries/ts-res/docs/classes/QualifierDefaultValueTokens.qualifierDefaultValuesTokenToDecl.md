[Home](../README.md) > [QualifierDefaultValueTokens](./QualifierDefaultValueTokens.md) > qualifierDefaultValuesTokenToDecl

## QualifierDefaultValueTokens.qualifierDefaultValuesTokenToDecl() method

Converts a QualifierDefaultValuesToken | qualifier default values token to a validated qualifier default values declaration.

**Signature:**

```typescript
qualifierDefaultValuesTokenToDecl(token: string): Result<IValidatedQualifierDefaultValuesDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the qualifier default values token to convert</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedQualifierDefaultValuesDecl](../type-aliases/IValidatedQualifierDefaultValuesDecl.md)&gt;

`Success` with the validated qualifier default values declaration if successful, `Failure` with an error message if not.
