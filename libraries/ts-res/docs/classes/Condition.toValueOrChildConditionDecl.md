[Home](../README.md) > [Condition](./Condition.md) > toValueOrChildConditionDecl

## Condition.toValueOrChildConditionDecl() method

Gets the value for this condition, or the ResourceJson.Json.IChildConditionDecl | child condition declaration
if the condition has non-default operator, priority or a score as default.

**Signature:**

```typescript
toValueOrChildConditionDecl(options?: IDeclarationOptions): string | IChildConditionDecl;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IDeclarationOptions</td><td>The ResourceJson.Helpers.IDeclarationOptions | options to use when creating the child
condition declaration.</td></tr>
</tbody></table>

**Returns:**

string | [IChildConditionDecl](../interfaces/IChildConditionDecl.md)

A string value for this condition, or the ResourceJson.Json.IChildConditionDecl | child condition declaration
if the condition has non-default operator, priority or a score as default.
