[Home](../../README.md) > [Context](../README.md) > [ContextTokens](./ContextTokens.md) > validateContextTokenParts

## ContextTokens.validateContextTokenParts() method

Validates the Helpers.IContextTokenParts | parts of a ContextToken | context token.

**Signature:**

```typescript
validateContextTokenParts(parts: IContextTokenParts): Result<IValidatedContextQualifierValueDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>parts</td><td>IContextTokenParts</td><td>the parts to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedContextQualifierValueDecl](../../interfaces/IValidatedContextQualifierValueDecl.md)&gt;

`Success` with the validated declaration if successful, `Failure` with an error message if not.
