[Home](../README.md) > [Condition](./Condition.md) > create

## Condition.create() method

Creates a new Conditions.Condition | Condition object from the supplied
Conditions.IValidatedConditionDecl | validated condition declaration.

**Signature:**

```typescript
static create(decl: IValidatedConditionDecl): Result<Condition>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>decl</td><td>IValidatedConditionDecl</td><td>The Conditions.IValidatedConditionDecl | validated condition declaration
describing the condition to create.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[Condition](Condition.md)&gt;

`Success` with the new Conditions.Condition | Condition if successful,
`Failure` otherwise.
