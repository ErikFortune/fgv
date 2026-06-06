[Home](../README.md) > [QualifierDefaultValueTokens](./QualifierDefaultValueTokens.md) > validateQualifierDefaultValueTokenParts

## QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts() method

Validates the Helpers.IQualifierDefaultValueTokenParts | parts of a QualifierDefaultValueToken | qualifier default value token.

**Signature:**

```typescript
validateQualifierDefaultValueTokenParts(parts: IQualifierDefaultValueTokenParts): Result<IValidatedQualifierDefaultValueDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>parts</td><td>IQualifierDefaultValueTokenParts</td><td>the parts to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedQualifierDefaultValueDecl](../interfaces/IValidatedQualifierDefaultValueDecl.md)&gt;

`Success` with the validated declaration if successful, `Failure` with an error message if not.
