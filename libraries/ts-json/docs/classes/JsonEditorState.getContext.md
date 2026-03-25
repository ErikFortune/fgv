[Home](../README.md) > [JsonEditorState](./JsonEditorState.md) > getContext

## JsonEditorState.getContext() method

Gets the context of this JsonEditorState | JsonEditorState or an optionally
supplied default context if this state has no context.

**Signature:**

```typescript
getContext(defaultContext?: IJsonContext): IJsonContext | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>defaultContext</td><td>IJsonContext</td><td>The default IJsonContext | JSON context to use as default
if this state has no context.</td></tr>
</tbody></table>

**Returns:**

[IJsonContext](../interfaces/IJsonContext.md) | undefined

The appropriate IJsonContext | IJsonContext or `undefined` if no context
is available.
