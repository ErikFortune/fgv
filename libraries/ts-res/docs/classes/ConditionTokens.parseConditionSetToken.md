[Home](../README.md) > [ConditionTokens](./ConditionTokens.md) > parseConditionSetToken

## ConditionTokens.parseConditionSetToken() method

Parses a ConditionSetToken | condition set token string and validates the parts
against the qualifiers present in the Conditions.ConditionTokens.qualifiers | qualifier collector.

**Signature:**

```typescript
parseConditionSetToken(token: string): Result<IValidatedConditionDecl[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the token string to parse.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedConditionDecl](../interfaces/IValidatedConditionDecl.md)[]&gt;

`Success` with the array of Conditions.IValidatedConditionDecl | validated condition declarations
if successful, `Failure` with an error message if not.
