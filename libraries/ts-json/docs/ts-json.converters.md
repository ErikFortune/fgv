<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-json](./ts-json.md) &gt; [Converters](./ts-json.converters.md)

## Converters namespace

## Functions

|  Function | Description |
|  --- | --- |
|  [conditionalJson(options)](./ts-json.converters.conditionaljson.md) | Converts the supplied unknown to strongly-typed JSON, by first rendering any property names or string values using mustache with the supplied context, then applying multi-value property expansion and conditional flattening based on property names. |
|  [richJson(options)](./ts-json.converters.richjson.md) | Converts the supplied unknown to strongly-typed JSON, by first rendering any property names or string values using mustache with the supplied context, then applying multi-value property expansion and conditional flattening based on property names. |
|  [templatedJson(options)](./ts-json.converters.templatedjson.md) | Converts the supplied unknown to JSON, rendering any property names or string values using mustache with the supplied context. See the mustache documentation for details of mustache syntax and view. |

## Variables

|  Variable | Description |
|  --- | --- |
|  [json](./ts-json.converters.json.md) | A simple validating JSON converter. Converts unknown to JSON or fails if the unknown contains any invalid JSON values. |
|  [jsonArray](./ts-json.converters.jsonarray.md) | A simple validating JSON converter. Converts unknown to a JSON array or fails if the unknown contains invalid JSON or is not an array. |
|  [jsonObject](./ts-json.converters.jsonobject.md) | A simple validating JSON converter. Converts unknown to a JSON object or fails if the unknown contains invalid JSON or is not an object. |
