[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > addCondition

## ResourceManagerBuilder.addCondition() method

Adds a condition to the manager.

**Signature:**

```typescript
addCondition(decl: ILooseConditionDecl): Result<Condition>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>ILooseConditionDecl</td><td>The condition declaration to add.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Condition](Condition.md)&gt;

`Success` with the condition if successful, or `Failure` with an error message if not.
