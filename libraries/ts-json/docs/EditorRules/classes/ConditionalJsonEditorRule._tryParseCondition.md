[Home](../../README.md) > [EditorRules](../README.md) > [ConditionalJsonEditorRule](./ConditionalJsonEditorRule.md) > _tryParseCondition

## ConditionalJsonEditorRule._tryParseCondition() method

Determines if a given property key is conditional. Derived classes can override this
method to use a different format for conditional properties.

**Signature:**

```typescript
_tryParseCondition(key: string, state: JsonEditorState): DetailedResult<IConditionalJsonKeyResult, JsonPropertyEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td></td></tr>
<tr><td>state</td><td>JsonEditorState</td><td>The JsonEditorState | editor state for the object being edited.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;[IConditionalJsonKeyResult](../../interfaces/IConditionalJsonKeyResult.md), [JsonPropertyEditFailureReason](../../type-aliases/JsonPropertyEditFailureReason.md)&gt;

`Success` with detail `'deferred'` and a
EditorRules.IConditionalJsonKeyResult | IConditionalJsonKeyResult describing the
match for a default or matching conditional property.  Returns `Failure` with detail `'ignore'`
for a non-matching conditional property. Fails with detail `'error'` if an error occurs
or with detail `'inapplicable'` if the key does not represent a conditional property.
