[Home](../../README.md) > [Conditions](../README.md) > [ConditionTokens](./ConditionTokens.md) > validateConditionTokenParts

## ConditionTokens.validateConditionTokenParts() method

Validates the Helpers.IConditionTokenParts | parts of a ConditionToken | condition token.

**Signature:**

```typescript
validateConditionTokenParts(parts: IConditionTokenParts): Result<IValidatedConditionDecl>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>parts</td><td>IConditionTokenParts</td><td>the parts to validate</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IValidatedConditionDecl](../../interfaces/IValidatedConditionDecl.md)&gt;

`Success` with the validated declaration if successful, `Failure` with an error message if not.
