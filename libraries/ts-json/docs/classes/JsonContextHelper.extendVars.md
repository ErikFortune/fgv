[Home](../README.md) > [JsonContextHelper](./JsonContextHelper.md) > extendVars

## JsonContextHelper.extendVars() method

Applies JsonContextHelper.extendContextVars | extendContextVars to the
IJsonContext | IJsonContext associated with this helper.

**Signature:**

```typescript
extendVars(vars?: VariableValue[]): Result<TemplateVars | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>vars</td><td>VariableValue[]</td><td>Optional VariableValue | variable values to be added to the</td></tr>
</tbody></table>

**Returns:**

Result&lt;[TemplateVars](../type-aliases/TemplateVars.md) | undefined&gt;

`Success` with a new TemplateVars | TemplateVars containing the variables
from the base context, merged with and overridden by any that were passed in, or `Failure`
with a message if an error occurs.
