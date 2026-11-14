[Home](../README.md) > [JsonContextHelper](./JsonContextHelper.md) > extendContext

## JsonContextHelper.extendContext() method

Applies static `JsonContextHelper.extendContext` to the
IJsonContext | IJsonContext associated with this helper.

**Signature:**

```typescript
extendContext(add?: { vars?: VariableValue[]; refs?: IJsonReferenceMap[] }): Result<IJsonContext | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>add</td><td>{ vars?: VariableValue[]; refs?: IJsonReferenceMap[] }</td><td>Optional initializer containing VariableValue | variable values and/or
IJsonReferenceMap | reference maps to be added to the IJsonContext | context.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IJsonContext](../interfaces/IJsonContext.md) | undefined&gt;

`Success` with a new IJsonContext | IJsonContext containing the variables and
references from the base context, merged with and overridden by any that were passed in, or
`Failure` with a message if an error occurs.
