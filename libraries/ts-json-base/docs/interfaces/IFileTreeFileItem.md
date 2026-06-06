[Home](../README.md) > IFileTreeFileItem

# Interface: IFileTreeFileItem

Interface for a read-only file in a file tree.

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

[type](./IFileTreeFileItem.type.md)

</td><td>

`readonly`

</td><td>

"file"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a file.

</td></tr>
<tr><td>

[absolutePath](./IFileTreeFileItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the file.

</td></tr>
<tr><td>

[name](./IFileTreeFileItem.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the file

</td></tr>
<tr><td>

[baseName](./IFileTreeFileItem.baseName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The base name of the file (without extension)

</td></tr>
<tr><td>

[extension](./IFileTreeFileItem.extension.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The extension of the file

</td></tr>
<tr><td>

[contentType](./IFileTreeFileItem.contentType.md)

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

[getContents()](./IFileTreeFileItem.getContents.md)

</td><td>



</td><td>

Gets the contents of the file as parsed JSON.

</td></tr>
<tr><td>

[getRawContents()](./IFileTreeFileItem.getRawContents.md)

</td><td>



</td><td>

Gets the raw contents of the file as a string.

</td></tr>
</tbody></table>
