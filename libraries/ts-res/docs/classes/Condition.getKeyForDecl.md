[Home](../README.md) > [Condition](./Condition.md) > getKeyForDecl

## Condition.getKeyForDecl() method

Gets the ConditionKey | condition key for a supplied Conditions.IValidatedConditionDecl | condition declaration.

**Signature:**

```typescript
static getKeyForDecl(decl: IValidatedConditionDecl): Result<ConditionKey>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>IValidatedConditionDecl</td><td>The Conditions.IValidatedConditionDecl | condition declaration for which to get the key.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionKey](../type-aliases/ConditionKey.md)&gt;

`Success` with the condition key if successful, `Failure` otherwise.
