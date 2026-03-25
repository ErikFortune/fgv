[Home](../../README.md) > [Context](../README.md) > [ContextTokens](./ContextTokens.md) > parseContextQualifierToken

## ContextTokens.parseContextQualifierToken() method

Parses a ContextQualifierToken | context qualifier token string and validates the parts
against the qualifiers present in the Context.ContextTokens.qualifiers | qualifier collector.

**Signature:**

```typescript
parseContextQualifierToken(token: string): Result<IValidatedContextQualifierValueDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the token string to parse.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedContextQualifierValueDecl](../../interfaces/IValidatedContextQualifierValueDecl.md)&gt;

`Success` with the Context.IValidatedContextQualifierValueDecl | validated context qualifier value declaration
if successful, `Failure` with an error message if not.
