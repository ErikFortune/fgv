[Home](../../README.md) > [FileTree](../README.md) > DirectoryItem

# Class: DirectoryItem

Class representing a directory in a file tree.

**Implements:** [`IMutableFileTreeDirectoryItem<TCT>`](../../interfaces/IMutableFileTreeDirectoryItem.md)

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

[type](./DirectoryItem.type.md)

</td><td>

`readonly`

</td><td>

"directory"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a directory

</td></tr>
<tr><td>

[absolutePath](./DirectoryItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the directory.

</td></tr>
<tr><td>

[_hal](./DirectoryItem._hal.md)

</td><td>

`readonly`

</td><td>

[IFileTreeAccessors](../../interfaces/IFileTreeAccessors.md)&lt;TCT&gt;

</td><td>

The FileTree.IFileTreeAccessors | accessors to use for file system operations.

</td></tr>
<tr><td>

[name](./DirectoryItem.name.md)

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

[create(path, hal)](./DirectoryItem.create.md)

</td><td>

`static`

</td><td>

Creates a new DirectoryItem instance.

</td></tr>
<tr><td>

[getChildren()](./DirectoryItem.getChildren.md)

</td><td>



</td><td>

Gets the children of the directory.

</td></tr>
<tr><td>

[createChildFile(name, contents)](./DirectoryItem.createChildFile.md)

</td><td>



</td><td>

Creates a new file as a child of this directory.

</td></tr>
<tr><td>

[createChildDirectory(name)](./DirectoryItem.createChildDirectory.md)

</td><td>



</td><td>

Creates a new subdirectory as a child of this directory.

</td></tr>
<tr><td>

[deleteChild(name, options)](./DirectoryItem.deleteChild.md)

</td><td>



</td><td>

Deletes a child item from this directory.

</td></tr>
<tr><td>

[delete()](./DirectoryItem.delete.md)

</td><td>



</td><td>

Deletes this directory from its backing store.

</td></tr>
</tbody></table>
