[Home](../README.md) > ZipFileItem

# Class: ZipFileItem

Implementation of `FileTree.IFileTreeFileItem` for files in a ZIP archive.
ZIP files are read-only, so this item does not support mutation.
Use FileTree.isMutableFileItem | isMutableFileItem to check before attempting mutations.

**Implements:** `IFileTreeFileItem<TCT>`

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

`constructor(zipFilePath, contents, accessors)`

</td><td>



</td><td>

Constructor for ZipFileItem.

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

[type](./ZipFileItem.type.md)

</td><td>

`readonly`

</td><td>

"file"

</td><td>

Indicates that this `FileTree.FileTreeItem` is a file.

</td></tr>
<tr><td>

[absolutePath](./ZipFileItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the file within the ZIP archive.

</td></tr>
<tr><td>

[name](./ZipFileItem.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the file

</td></tr>
<tr><td>

[baseName](./ZipFileItem.baseName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The base name of the file (without extension)

</td></tr>
<tr><td>

[extension](./ZipFileItem.extension.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The extension of the file

</td></tr>
<tr><td>

[contentType](./ZipFileItem.contentType.md)

</td><td>

`readonly`

</td><td>

TCT | undefined

</td><td>

The content type of the file.

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

[setContentType(contentType)](./ZipFileItem.setContentType.md)

</td><td>



</td><td>

Sets the content type of the file.

</td></tr>
<tr><td>

[getContents()](./ZipFileItem.getContents.md)

</td><td>



</td><td>

Gets the contents of the file as parsed JSON.

</td></tr>
<tr><td>

[getRawContents()](./ZipFileItem.getRawContents.md)

</td><td>



</td><td>

Gets the raw contents of the file as a string.

</td></tr>
</tbody></table>
