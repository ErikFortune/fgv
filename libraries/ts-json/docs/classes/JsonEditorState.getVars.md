[Home](../README.md) > [JsonEditorState](./JsonEditorState.md) > getVars

## JsonEditorState.getVars() method

Gets a TemplateVars | TemplateVars from the context of this JsonEditorState | JsonEditorState,
or from an optional supplied IJsonContext | IJsonContext if the current state has no default
context.

**Signature:**

```typescript
getVars(defaultContext?: IJsonContext): TemplateVars | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>defaultContext</td><td>IJsonContext</td><td>An optional default IJsonContext | IJsonContext to use as `TemplateVars`
if the current state does not have context.</td></tr>
</tbody></table>

**Returns:**

[TemplateVars](../type-aliases/TemplateVars.md) | undefined

A TemplateVars | TemplateVars reflecting the appropriate IJsonContext | JSON context, or
`undefined` if no vars are found.
