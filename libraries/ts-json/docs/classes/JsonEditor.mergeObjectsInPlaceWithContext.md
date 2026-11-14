[Home](../README.md) > [JsonEditor](./JsonEditor.md) > mergeObjectsInPlaceWithContext

## JsonEditor.mergeObjectsInPlaceWithContext() method

Merges multiple supplied source objects into a supplied target, updating the target
object and using an optional IJsonContext | context supplied in the call.

**Signature:**

```typescript
mergeObjectsInPlaceWithContext(context: IJsonContext | undefined, base: JsonObject, srcObjects: JsonObject[]): Result<JsonObject>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>context</td><td>IJsonContext | undefined</td><td>An optional IJsonContext | IJsonContext supplying variables and
references.</td></tr>
<tr><td>base</td><td>JsonObject</td><td>The base `JsonObject` to be updated</td></tr>
<tr><td>srcObjects</td><td>JsonObject[]</td><td>Objects to be merged into the target object, in the order supplied.</td></tr>
</tbody></table>

**Returns:**

Result&lt;JsonObject&gt;

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.
