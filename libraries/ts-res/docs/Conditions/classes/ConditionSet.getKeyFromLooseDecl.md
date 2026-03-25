[Home](../../README.md) > [Conditions](../README.md) > [ConditionSet](./ConditionSet.md) > getKeyFromLooseDecl

## ConditionSet.getKeyFromLooseDecl() method

Gets a condition set key from a loose condition set declaration.

**Signature:**

```typescript
static getKeyFromLooseDecl(conditionSet: ConditionSetDecl | undefined, conditionCollector: ConditionCollector): Result<ConditionSetKey>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>conditionSet</td><td>ConditionSetDecl | undefined</td><td>The loose condition set declaration to convert.</td></tr>
<tr><td>conditionCollector</td><td>ConditionCollector</td><td>The condition collector used for validation.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSetKey](../../type-aliases/ConditionSetKey.md)&gt;

`Success` with the condition set key if successful, `Failure` otherwise.
