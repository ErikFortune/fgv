[Home](../README.md) > [ConditionTokens](./ConditionTokens.md) > parseConditionToken

## ConditionTokens.parseConditionToken() method

i
Parses a ConditionToken | condition token string and validates the parts
against the qualifiers present in the Conditions.ConditionTokens.qualifiers | qualifier collector.

**Signature:**

```typescript
parseConditionToken(token: string): Result<IValidatedConditionDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td>the token string to parse.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedConditionDecl](../interfaces/IValidatedConditionDecl.md)&gt;

`Success` with the Conditions.IValidatedConditionDecl | validated condition declaration
if successful, `Failure` with an error message if not.
