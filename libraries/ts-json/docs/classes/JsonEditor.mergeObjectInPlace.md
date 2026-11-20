[Home](../README.md) > [JsonEditor](./JsonEditor.md) > mergeObjectInPlace

## JsonEditor.mergeObjectInPlace() method

Merges a supplied source object into a supplied target, updating the target object.

**Signature:**

```typescript
mergeObjectInPlace(target: JsonObject, src: JsonObject, runtimeContext?: IJsonContext): Result<JsonObject>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>target</td><td>JsonObject</td><td>The target `JsonObject` to be updated</td></tr>
<tr><td>src</td><td>JsonObject</td><td>The source `JsonObject` to be merged</td></tr>
<tr><td>runtimeContext</td><td>IJsonContext</td><td>An optional IJsonContext | IJsonContext supplying variables
and references.</td></tr>
</tbody></table>

**Returns:**

Result&lt;JsonObject&gt;

`Success` with the original source `JsonObject` if merge was successful.
Returns `Failure` with details if an error occurs.
