[Home](../README.md) > [JsonContextHelper](./JsonContextHelper.md) > extendContextVars

## JsonContextHelper.extendContextVars() method

Static helper to extend context variables for a supplied IJsonContext | IJsonContext.

**Signature:**

```typescript
static extendContextVars(baseContext: IJsonContext | undefined, vars?: VariableValue[]): Result<TemplateVars | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseContext</td><td>IJsonContext | undefined</td><td>The IJsonContext | IJsonContext to be extended, or `undefined`
to start from an empty context.</td></tr>
<tr><td>vars</td><td>VariableValue[]</td><td>Optional VariableValue | variable values to be added to the
IJsonContext | context.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[TemplateVars](../type-aliases/TemplateVars.md) | undefined&gt;

`Success` with a new TemplateVars | TemplateVars containing the variables
from the base context, merged with and overridden by any that were passed in, or `Failure`
with a message if an error occurs.
