[Home](../README.md) > [JsonEditorState](./JsonEditorState.md) > extendContext

## JsonEditorState.extendContext() method

Constructs a new IJsonContext | IJsonContext by merging supplied variables
and references into a supplied existing context.

**Signature:**

```typescript
extendContext(baseContext: IJsonContext | undefined, add: { vars?: VariableValue[]; refs?: IJsonReferenceMap[] }): Result<IJsonContext | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>baseContext</td><td>IJsonContext | undefined</td><td>The IJsonContext | IJsonContext into which variables
and references are to be merged, or `undefined` to start with a default empty context.</td></tr>
<tr><td>add</td><td>{ vars?: VariableValue[]; refs?: IJsonReferenceMap[] }</td><td>The VariableValue | variable values and/or
IJsonReferenceMap | JSON entity references to be merged into the base context.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IJsonContext](../interfaces/IJsonContext.md) | undefined&gt;

A new IJsonContext | IJsonContext created by merging the supplied values.
