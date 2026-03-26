[Home](../README.md) > [ConditionSet](./ConditionSet.md) > create

## ConditionSet.create() method

Creates a new Conditions.ConditionSet | ConditionSet object.

**Signature:**

```typescript
static create(params: IValidatedConditionSetDecl): Result<ConditionSet>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IValidatedConditionSetDecl</td><td>Conditions.IValidatedConditionSetDecl | Validated declaration
used to create the condition set.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ConditionSet](ConditionSet.md)&gt;

`Success` with the new Conditions.ConditionSet | ConditionSet object if successful,
or `Failure` with an error message if not.
