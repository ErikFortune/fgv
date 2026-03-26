[Home](../README.md) > IMutableFileTreeDirectoryItem

# Interface: IMutableFileTreeDirectoryItem

Extended directory item interface that supports mutation operations.
Use FileTree.isMutableDirectoryItem | isMutableDirectoryItem type guard to narrow.

**Extends:** [`IFileTreeDirectoryItem<TCT>`](IFileTreeDirectoryItem.md)

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

[type](./IFileTreeDirectoryItem.type.md)

</td><td>

`readonly`

</td><td>

"directory"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a directory

</td></tr>
<tr><td>

[absolutePath](./IFileTreeDirectoryItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the directory.

</td></tr>
<tr><td>

[name](./IFileTreeDirectoryItem.name.md)

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

[createChildFile(name, contents)](./IMutableFileTreeDirectoryItem.createChildFile.md)

</td><td>



</td><td>

Creates a new file as a child of this directory.

</td></tr>
<tr><td>

[createChildDirectory(name)](./IMutableFileTreeDirectoryItem.createChildDirectory.md)

</td><td>



</td><td>

Creates a new subdirectory as a child of this directory.

</td></tr>
<tr><td>

[deleteChild(name, options)](./IMutableFileTreeDirectoryItem.deleteChild.md)

</td><td>



</td><td>

Deletes a child item from this directory.

</td></tr>
<tr><td>

[delete()](./IMutableFileTreeDirectoryItem.delete.md)

</td><td>



</td><td>

Deletes this directory from its backing store.

</td></tr>
<tr><td>

[getChildren()](./IFileTreeDirectoryItem.getChildren.md)

</td><td>



</td><td>

Gets the children of the directory.

</td></tr>
</tbody></table>
