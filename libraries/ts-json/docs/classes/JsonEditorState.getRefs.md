[Home](../README.md) > [JsonEditorState](./JsonEditorState.md) > getRefs

## JsonEditorState.getRefs() method

Gets an IJsonReferenceMap | reference map containing any other values
referenced during the operation.

**Signature:**

```typescript
getRefs(defaultContext?: IJsonContext): IJsonReferenceMap | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>defaultContext</td><td>IJsonContext</td><td>An optional default IJsonContext | IJsonContext to use as
TemplateVars | TemplateVars if the current state does not have context.</td></tr>
</tbody></table>

**Returns:**

[IJsonReferenceMap](../interfaces/IJsonReferenceMap.md) | undefined

An IJsonReferenceMap | IJsonReferenceMap containing any values referenced
during this operation.
