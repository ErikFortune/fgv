[Home](../README.md) > [IJsonReferenceMap](./IJsonReferenceMap.md) > getJsonValue

## IJsonReferenceMap.getJsonValue() method

Gets a `JsonValue` specified by key.

**Signature:**

```typescript
getJsonValue(key: string, context?: IJsonContext): DetailedResult<JsonValue, JsonReferenceMapFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key of the object to be retrieved.</td></tr>
<tr><td>context</td><td>IJsonContext</td><td>Optional IJsonContext | JSON Context used to format the value</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonValue, [JsonReferenceMapFailureReason](../type-aliases/JsonReferenceMapFailureReason.md)&gt;

`Success` with the formatted `JsonValue` if successful. `Failure`
with detail `'unknown'` if no such object exists, or `Failure` with detail `'error'` if
the object was found but could not be formatted.
