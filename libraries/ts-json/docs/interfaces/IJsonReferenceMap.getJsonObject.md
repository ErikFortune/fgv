[Home](../README.md) > [IJsonReferenceMap](./IJsonReferenceMap.md) > getJsonObject

## IJsonReferenceMap.getJsonObject() method

Gets a `JsonObject` specified by key.

**Signature:**

```typescript
getJsonObject(key: string, context?: IJsonContext): DetailedResult<JsonObject, JsonReferenceMapFailureReason>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key of the object to be retrieved.</td></tr>
<tr><td>context</td><td>IJsonContext</td><td>Optional IJsonContext | IJsonContext used to construct
the object.</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;JsonObject, [JsonReferenceMapFailureReason](../type-aliases/JsonReferenceMapFailureReason.md)&gt;

`Success` with the formatted JsonObject if successful. `Failure`
with detail `'unknown'`  if no such object exists, or `Failure` with detail `'error'` if
the object was found but could not be formatted.
