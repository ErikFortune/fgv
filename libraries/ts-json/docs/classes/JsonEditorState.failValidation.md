[Home](../README.md) > [JsonEditorState](./JsonEditorState.md) > failValidation

## JsonEditorState.failValidation() method

Helper method to constructs  `DetailedFailure` with appropriate details and messaging
for various validation failures.

**Signature:**

```typescript
failValidation(rule: JsonEditorValidationRules, message?: string, validation?: IJsonEditorValidationOptions): DetailedFailure<T, JsonEditFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>rule</td><td>JsonEditorValidationRules</td><td>The JsonEditorValidationRules | validation rule that failed.</td></tr>
<tr><td>message</td><td>string</td><td>A string message describing the failed validation.</td></tr>
<tr><td>validation</td><td>IJsonEditorValidationOptions</td><td>The IJsonEditorValidationOptions | validation options
in effect.</td></tr>
</tbody></table>

**Returns:**

DetailedFailure&lt;T, [JsonEditFailureReason](../type-aliases/JsonEditFailureReason.md)&gt;

A `DetailedFailure` with appropriate detail and message.
