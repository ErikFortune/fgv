<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [isJsonObject](./ts-json.isjsonobject.md)

## isJsonObject() function

Test if an `unknown` is potentially a [JsonObject](./ts-json.jsonobject.md)<!-- -->.

**Signature:**

```typescript
export declare function isJsonObject(from: unknown): from is JsonObject;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  from | unknown | The <code>unknown</code> to be tested. |

**Returns:**

from is [JsonObject](./ts-json.jsonobject.md)

`true` if the supplied parameter is a non-array object, `false` otherwise.
