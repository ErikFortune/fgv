[Home](../README.md) > FileItem

# Class: FileItem

Class representing a file in a file tree.

**Implements:** [`IMutableFileTreeFileItem<TCT>`](../interfaces/IMutableFileTreeFileItem.md)

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

[type](./FileItem.type.md)

</td><td>

`readonly`

</td><td>

"file"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a file.

</td></tr>
<tr><td>

[absolutePath](./FileItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the file.

</td></tr>
<tr><td>

[_contentType](./FileItem._contentType.md)

</td><td>



</td><td>

TCT | undefined

</td><td>

Mutable content type of the file.

</td></tr>
<tr><td>

[_hal](./FileItem._hal.md)

</td><td>

`readonly`

</td><td>

[IFileTreeAccessors](../interfaces/IFileTreeAccessors.md)&lt;TCT&gt;

</td><td>

The FileTree.IFileTreeAccessors | accessors to use for file system operations.

</td></tr>
<tr><td>

[name](./FileItem.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the file

</td></tr>
<tr><td>

[baseName](./FileItem.baseName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The base name of the file (without extension)

</td></tr>
<tr><td>

[extension](./FileItem.extension.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The extension of the file

</td></tr>
<tr><td>

[contentType](./FileItem.contentType.md)

</td><td>

`readonly`

</td><td>

TCT | undefined

</td><td>

An optional content type (e.g.

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

[create(path, hal)](./FileItem.create.md)

</td><td>

`static`

</td><td>

Creates a new FileTree.FileItem instance.

</td></tr>
<tr><td>

[defaultInferContentType(filePath, provided)](./FileItem.defaultInferContentType.md)

</td><td>

`static`

</td><td>

Default function to infer the content type of a file.

</td></tr>
<tr><td>

[defaultAcceptContentType(filePath, provided)](./FileItem.defaultAcceptContentType.md)

</td><td>

`static`

</td><td>

Default function to accept the content type of a file.

</td></tr>
<tr><td>

[getIsMutable()](./FileItem.getIsMutable.md)

</td><td>



</td><td>

FileTree.IFileTreeFileItem.getIsMutable

</td></tr>
<tr><td>

[getContents()](./FileItem.getContents.md)

</td><td>



</td><td>

Gets the contents of the file as parsed JSON.

</td></tr>
<tr><td>

[getRawContents()](./FileItem.getRawContents.md)

</td><td>



</td><td>

Gets the raw contents of the file as a string.

</td></tr>
<tr><td>

[setContentType(contentType)](./FileItem.setContentType.md)

</td><td>



</td><td>

Sets the content type of the file.

</td></tr>
<tr><td>

[setContents(json)](./FileItem.setContents.md)

</td><td>



</td><td>

FileTree.IFileTreeFileItem.setContents

</td></tr>
<tr><td>

[setRawContents(contents)](./FileItem.setRawContents.md)

</td><td>



</td><td>

FileTree.IFileTreeFileItem.setRawContents

</td></tr>
<tr><td>

[delete()](./FileItem.delete.md)

</td><td>



</td><td>

FileTree.IFileTreeFileItem.delete

</td></tr>
</tbody></table>
