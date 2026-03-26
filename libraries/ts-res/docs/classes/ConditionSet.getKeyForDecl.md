[Home](../README.md) > [ConditionSet](./ConditionSet.md) > getKeyForDecl

## ConditionSet.getKeyForDecl() method

Gets the ConditionSetKey | key for a supplied Conditions.IValidatedConditionSetDecl | condition set declaration.

**Signature:**

```typescript
static getKeyForDecl(decl: IValidatedConditionSetDecl): Result<ConditionSetKey>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>IValidatedConditionSetDecl</td><td>The Conditions.IValidatedConditionSetDecl | condition set declaration for which to get the key.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSetKey](../type-aliases/ConditionSetKey.md)&gt;

`Success` with the condition set key if successful, `Failure` otherwise.
