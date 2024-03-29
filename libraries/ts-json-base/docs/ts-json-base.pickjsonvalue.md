<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json-base](./ts-json-base.md) &gt; [pickJsonValue](./ts-json-base.pickjsonvalue.md)

## pickJsonValue() function

Picks a nested field from a supplied [JsonObject](./ts-json-base.jsonobject.md)<!-- -->.

**Signature:**

```typescript
export declare function pickJsonValue(src: JsonObject, path: string): Result<JsonValue>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  src | [JsonObject](./ts-json-base.jsonobject.md) | The [object](./ts-json-base.jsonobject.md) from which the field is to be picked. |
|  path | string | Dot-separated path of the member to be picked. |

**Returns:**

Result&lt;[JsonValue](./ts-json-base.jsonvalue.md)<!-- -->&gt;

`Success` with the property if the path is valid, `Failure` with an error message otherwise.

