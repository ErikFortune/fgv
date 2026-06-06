# @fgv/ts-json-base

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Converters](./Converters/README.md)

</td><td>



</td></tr>
<tr><td>

[FileTree](./FileTree/README.md)

</td><td>



</td></tr>
<tr><td>

[JsonCompatible](./JsonCompatible/README.md)

</td><td>



</td></tr>
<tr><td>

[JsonFile](./JsonFile/README.md)

</td><td>



</td></tr>
<tr><td>

[JsonSchema](./JsonSchema/README.md)

</td><td>



</td></tr>
<tr><td>

[Validators](./Validators/README.md)

</td><td>



</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[JsonObject](./interfaces/JsonObject.md)

</td><td>

A JsonObject | JsonObject is a string-keyed object

</td></tr>
<tr><td>

[JsonArray](./interfaces/JsonArray.md)

</td><td>

A JsonArray | JsonArray is an array containing only valid JsonValue | JsonValues.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[JsonPrimitive](./type-aliases/JsonPrimitive.md)

</td><td>

Primitive (terminal) values allowed in by JSON.

</td></tr>
<tr><td>

[JsonValue](./type-aliases/JsonValue.md)

</td><td>

A JsonValue | JsonValue is one of: a JsonPrimitive | JsonPrimitive,

</td></tr>
<tr><td>

[JsonValueType](./type-aliases/JsonValueType.md)

</td><td>

Classes of JsonValue | JsonValue.

</td></tr>
<tr><td>

[JsonCompatibleType](./type-aliases/JsonCompatibleType.md)

</td><td>

A constrained type that is compatible with JSON serialization.

</td></tr>
<tr><td>

[JsonCompatibleArray](./type-aliases/JsonCompatibleArray.md)

</td><td>

A type that represents an array of JSON-compatible values.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isJsonPrimitive](./functions/isJsonPrimitive.md)

</td><td>

Test if an `unknown` is a JsonValue | JsonValue.

</td></tr>
<tr><td>

[isJsonObject](./functions/isJsonObject.md)

</td><td>

Test if an `unknown` is potentially a JsonObject | JsonObject.

</td></tr>
<tr><td>

[isJsonArray](./functions/isJsonArray.md)

</td><td>

Test if an `unknown` is potentially a JsonArray | JsonArray.

</td></tr>
<tr><td>

[classifyJsonValue](./functions/classifyJsonValue.md)

</td><td>

Identifies whether some `unknown` value is a JsonPrimitive | primitive,
JsonObject | object or JsonArray | array.

</td></tr>
<tr><td>

[pickJsonValue](./functions/pickJsonValue.md)

</td><td>

Picks a nested field from a supplied JsonObject | JsonObject.

</td></tr>
<tr><td>

[pickJsonObject](./functions/pickJsonObject.md)

</td><td>

Picks a nested JsonObject | JsonObject from a supplied

</td></tr>
<tr><td>

[sanitizeJson](./functions/sanitizeJson.md)

</td><td>

"Sanitizes" an `unknown` by stringifying and then parsing it.

</td></tr>
<tr><td>

[sanitizeJsonObject](./functions/sanitizeJsonObject.md)

</td><td>

Sanitizes some value using JSON stringification and parsing, returning an

</td></tr>
</tbody></table>
