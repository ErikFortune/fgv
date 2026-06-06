[Home](../../README.md) > [EditorRules](../README.md) > [MultiValueJsonEditorRule](./MultiValueJsonEditorRule.md) > _deriveContext

## MultiValueJsonEditorRule._deriveContext() method

Extends the IJsonContext | current context with a supplied state and values.

**Signature:**

```typescript
_deriveContext(state: JsonEditorState, values: VariableValue[]): Result<IJsonContext | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object being edited.</td></tr>
<tr><td>values</td><td>VariableValue[]</td><td>An array of VariableValue | VariableValue to be added to the
context.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IJsonContext](../../interfaces/IJsonContext.md) | undefined&gt;

The extended IJsonContext | context.
