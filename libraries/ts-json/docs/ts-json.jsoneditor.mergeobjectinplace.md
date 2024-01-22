<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [JsonEditor](./ts-json.jsoneditor.md) &gt; [mergeObjectInPlace](./ts-json.jsoneditor.mergeobjectinplace.md)

## JsonEditor.mergeObjectInPlace() method

Merges a supplied source object into a supplied target, updating the target object.

**Signature:**

```typescript
mergeObjectInPlace(target: JsonObject, src: JsonObject, runtimeContext?: IJsonContext): Result<JsonObject>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  target | JsonObject | The target  to be updated |
|  src | JsonObject | The source  to be merged |
|  runtimeContext | [IJsonContext](./ts-json.ijsoncontext.md) | _(Optional)_ An optional [IJsonContext](./ts-json.ijsoncontext.md) supplying variables and references. |

**Returns:**

Result&lt;JsonObject&gt;

`Success` with the original source  if merge was successful. Returns `Failure` with details if an error occurs.
