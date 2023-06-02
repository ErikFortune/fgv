<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [Editor](./ts-json.editor.md) &gt; [Rules](./ts-json.editor.rules.md) &gt; [MultiValueJsonEditorRule](./ts-json.editor.rules.multivaluejsoneditorrule.md) &gt; [\_tryParse](./ts-json.editor.rules.multivaluejsoneditorrule._tryparse.md)

## Editor.Rules.MultiValueJsonEditorRule.\_tryParse() method

Determines if a given property key is multi-value. Derived classes can override this method to use a different format for multi-value properties.

**Signature:**

```typescript
protected _tryParse(token: string, state: JsonEditorState): DetailedResult<IMultiValuePropertyParts, JsonEditFailureReason>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  token | string |  |
|  state | [JsonEditorState](./ts-json.editor.jsoneditorstate.md) | The [editor state](./ts-json.editor.jsoneditorstate.md) for the object being edited. |

**Returns:**

DetailedResult&lt;[IMultiValuePropertyParts](./ts-json.editor.rules.imultivaluepropertyparts.md)<!-- -->, [JsonEditFailureReason](./ts-json.editor.jsoneditfailurereason.md)<!-- -->&gt;

`Success` with detail `'deferred'` and an [IMultiValuePropertyParts](./ts-json.editor.rules.imultivaluepropertyparts.md) describing the match for matching multi-value property. Returns `Failure` with detail `'error'` if an error occurs or with detail `'inapplicable'` if the key does not represent a multi-value property.
