[Home](../README.md) > [MultiValueJsonEditorRule](./MultiValueJsonEditorRule.md) > _tryParse

## MultiValueJsonEditorRule._tryParse() method

Determines if a given property key is multi-value. Derived classes can override this
method to use a different format for multi-value properties.

**Signature:**

```typescript
_tryParse(token: string, state: JsonEditorState): DetailedResult<IMultiValuePropertyParts, JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>token</td><td>string</td><td></td></tr>
<tr><td>state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object being edited.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[IMultiValuePropertyParts](../interfaces/IMultiValuePropertyParts.md), [JsonEditFailureReason](../type-aliases/JsonEditFailureReason.md)&gt;

`Success` with detail `'deferred'` and an
EditorRules.IMultiValuePropertyParts | IMultiValuePropertyParts
describing the match for matching multi-value property.  Returns `Failure` with detail `'error'` if an error occurs
or with detail `'inapplicable'` if the key does not represent a multi-value property.
