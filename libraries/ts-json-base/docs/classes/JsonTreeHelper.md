[Home](../README.md) > JsonTreeHelper

# Class: JsonTreeHelper

Helper class to work with JSON files using FileTree API (web-compatible).

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

`constructor(json)`

</td><td>



</td><td>

Construct a new JsonTreeHelper.

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

[json](./JsonTreeHelper.json.md)

</td><td>

`readonly`

</td><td>

[IJsonLike](../interfaces/IJsonLike.md)

</td><td>

Configuration for this JsonTreeHelper.

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

[readJsonFromTree(fileTree, filePath)](./JsonTreeHelper.readJsonFromTree.md)

</td><td>



</td><td>

Read type-safe JSON from a file in a FileTree.

</td></tr>
<tr><td>

[convertJsonFromTree(fileTree, filePath, cv, context)](./JsonTreeHelper.convertJsonFromTree.md)

</td><td>



</td><td>

Read a JSON file from a FileTree and apply a supplied converter or validator.

</td></tr>
<tr><td>

[convertJsonDirectoryFromTree(fileTree, dirPath, cv, filePattern, context)](./JsonTreeHelper.convertJsonDirectoryFromTree.md)

</td><td>



</td><td>

Reads all JSON files from a directory in a FileTree and applies a converter or validator.

</td></tr>
<tr><td>

[convertJsonDirectoryToMapFromTree(fileTree, dirPath, cv, filePattern, context)](./JsonTreeHelper.convertJsonDirectoryToMapFromTree.md)

</td><td>



</td><td>

Reads and converts all JSON files from a directory in a FileTree,

</td></tr>
</tbody></table>
