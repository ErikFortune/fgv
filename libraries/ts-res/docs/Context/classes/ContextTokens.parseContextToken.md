[Home](../../README.md) > [Context](../README.md) > [ContextTokens](./ContextTokens.md) > parseContextToken

## ContextTokens.parseContextToken() method

Parses a ContextToken | context token string and validates the parts
against the qualifiers present in the Context.ContextTokens.qualifiers | qualifier collector.

**Signature:**

```typescript
parseContextToken(token: string): Result<IValidatedContextQualifierValueDecl[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the token string to parse.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedContextQualifierValueDecl](../../interfaces/IValidatedContextQualifierValueDecl.md)[]&gt;

`Success` with the array of Context.IValidatedContextQualifierValueDecl | validated context qualifier value declarations
if successful, `Failure` with an error message if not.
