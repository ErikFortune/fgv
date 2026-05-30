[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > addConditionSet

## ResourceManagerBuilder.addConditionSet() method

Adds a condition set to the manager.

**Signature:**

```typescript
addConditionSet(conditions: ConditionSetDecl): Result<ConditionSet>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>conditions</td><td>ConditionSetDecl</td><td>The ResourceJson.Normalized.ConditionSetDecl | condition set declaration to add.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSet](ConditionSet.md)&gt;

`Success` with the condition set if successful, or `Failure` with an error message if not.
