[Home](../../README.md) > [JsonFile](../README.md) > JsonFsHelper

# Class: JsonFsHelper

Helper class to simplify common filesystem operations involving JSON (or JSON-like)
files.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(init)`

</td><td>



</td><td>

Construct a new JsonFile.JsonFsHelper | JsonFsHelper.

</td></tr>
</tbody></table>

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[config](./JsonFsHelper.config.md)

</td><td>

`readonly`

</td><td>

[IJsonFsHelperConfig](../../interfaces/IJsonFsHelperConfig.md)

</td><td>

Configuration for this JsonFile.JsonFsHelper | JsonFsHelper.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[readJsonFileSync(srcPath)](./JsonFsHelper.readJsonFileSync.md)

</td><td>



</td><td>

Read type-safe JSON from a file.

</td></tr>
<tr><td>

[convertJsonFileSync(srcPath, cv, context)](./JsonFsHelper.convertJsonFileSync.md)

</td><td>



</td><td>

Read a JSON file and apply a supplied converter or validator.

</td></tr>
<tr><td>

[convertJsonDirectorySync(srcPath, options, context)](./JsonFsHelper.convertJsonDirectorySync.md)

</td><td>



</td><td>

Reads all JSON files from a directory and apply a supplied converter or validator.

</td></tr>
<tr><td>

[convertJsonDirectoryToMapSync(srcPath, options, context)](./JsonFsHelper.convertJsonDirectoryToMapSync.md)

</td><td>



</td><td>

Reads and converts or validates all JSON files from a directory, returning a
`Map<string, T>` indexed by file base name (i.e.

</td></tr>
<tr><td>

[writeJsonFileSync(srcPath, value)](./JsonFsHelper.writeJsonFileSync.md)

</td><td>



</td><td>

Write type-safe JSON to a file.

</td></tr>
</tbody></table>
