[Home](../../README.md) > [ZipFileTree](../README.md) > ZipDirectoryItem

# Class: ZipDirectoryItem

Implementation of `IFileTreeDirectoryItem` for directories in a ZIP archive.

**Implements:** `IFileTreeDirectoryItem<TCT>`

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

`constructor(directoryPath, accessors)`

</td><td>



</td><td>

Constructor for ZipDirectoryItem.

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

[type](./ZipDirectoryItem.type.md)

</td><td>

`readonly`

</td><td>

"directory"

</td><td>

Indicates that this `FileTree.FileTreeItem` is a directory.

</td></tr>
<tr><td>

[absolutePath](./ZipDirectoryItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the directory within the ZIP archive.

</td></tr>
<tr><td>

[name](./ZipDirectoryItem.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the directory

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

[getChildren()](./ZipDirectoryItem.getChildren.md)

</td><td>



</td><td>

Gets the children of the directory.

</td></tr>
</tbody></table>
