[Home](../README.md) > JsonFile

# Namespace: JsonFile

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[JsonTreeHelper](./classes/JsonTreeHelper.md)

</td><td>

Helper class to work with JSON files using FileTree API (web-compatible).

</td></tr>
<tr><td>

[JsonFsHelper](./classes/JsonFsHelper.md)

</td><td>

Helper class to simplify common filesystem operations involving JSON (or JSON-like)

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

[IJsonLike](./interfaces/IJsonLike.md)

</td><td>



</td></tr>
<tr><td>

[IJsonFsDirectoryOptions](./interfaces/IJsonFsDirectoryOptions.md)

</td><td>

Options for directory conversion.

</td></tr>
<tr><td>

[IReadDirectoryItem](./interfaces/IReadDirectoryItem.md)

</td><td>

Return value for one item in a directory conversion.

</td></tr>
<tr><td>

[IJsonFsDirectoryToMapOptions](./interfaces/IJsonFsDirectoryToMapOptions.md)

</td><td>

Options controlling conversion of a directory to a `Map`.

</td></tr>
<tr><td>

[IJsonFsHelperConfig](./interfaces/IJsonFsHelperConfig.md)

</td><td>

Configuration for JsonFile.JsonFsHelper | JsonFsHelper.

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

[JsonReviver](./type-aliases/JsonReviver.md)

</td><td>



</td></tr>
<tr><td>

[JsonReplacerFunction](./type-aliases/JsonReplacerFunction.md)

</td><td>



</td></tr>
<tr><td>

[JsonReplacerArray](./type-aliases/JsonReplacerArray.md)

</td><td>



</td></tr>
<tr><td>

[JsonReplacer](./type-aliases/JsonReplacer.md)

</td><td>



</td></tr>
<tr><td>

[ItemNameTransformFunction](./type-aliases/ItemNameTransformFunction.md)

</td><td>

Function to transform the name of a some entity, given an original name

</td></tr>
<tr><td>

[JsonFsHelperInitOptions](./type-aliases/JsonFsHelperInitOptions.md)

</td><td>

Initialization options for JsonFile.JsonFsHelper | JsonFsHelper.

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

[readJsonFileSync](./functions/readJsonFileSync.md)

</td><td>

Read type-safe JSON from a file.

</td></tr>
<tr><td>

[convertJsonFileSync](./functions/convertJsonFileSync.md)

</td><td>

Read a JSON file and apply a supplied converter.

</td></tr>
<tr><td>

[convertJsonDirectorySync](./functions/convertJsonDirectorySync.md)

</td><td>

Reads all JSON files from a directory and apply a supplied converter.

</td></tr>
<tr><td>

[convertJsonDirectoryToMapSync](./functions/convertJsonDirectoryToMapSync.md)

</td><td>

Reads and converts all JSON files from a directory, returning a
`Map<string, T>` indexed by file base name (i.e.

</td></tr>
<tr><td>

[writeJsonFileSync](./functions/writeJsonFileSync.md)

</td><td>

Write type-safe JSON to a file.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[DefaultJsonLike](./variables/DefaultJsonLike.md)

</td><td>



</td></tr>
<tr><td>

[DefaultJsonTreeHelper](./variables/DefaultJsonTreeHelper.md)

</td><td>



</td></tr>
<tr><td>

[DefaultJsonFsHelperConfig](./variables/DefaultJsonFsHelperConfig.md)

</td><td>

Default configuration for JsonFile.JsonFsHelper | JsonFsHelper.

</td></tr>
<tr><td>

[DefaultJsonFsHelper](./variables/DefaultJsonFsHelper.md)

</td><td>



</td></tr>
</tbody></table>
