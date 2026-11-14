[Home](../../README.md) > [FileTree](../README.md) > IMutableBinaryFileTreeDirectoryItem

# Interface: IMutableBinaryFileTreeDirectoryItem

Extended directory item interface for directories that can create a child file
directly from raw bytes.

**Extends:** [`IMutableFileTreeDirectoryItem<TCT>`](../../interfaces/IMutableFileTreeDirectoryItem.md)

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

[type](./IMutableFileTreeDirectoryItem.type.md)

</td><td>

`readonly`

</td><td>

"directory"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a directory

</td></tr>
<tr><td>

[absolutePath](./IMutableFileTreeDirectoryItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the directory.

</td></tr>
<tr><td>

[name](./IMutableFileTreeDirectoryItem.name.md)

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

[canCreateChildFileBytes()](./IMutableBinaryFileTreeDirectoryItem.canCreateChildFileBytes.md)

</td><td>



</td><td>

Reports whether the backing store can persist bytes verbatim.

</td></tr>
<tr><td>

[createChildFileBytes(name, bytes)](./IMutableBinaryFileTreeDirectoryItem.createChildFileBytes.md)

</td><td>



</td><td>

Creates a new file as a child of this directory from raw bytes, with no text

</td></tr>
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

[getChildren()](./IMutableFileTreeDirectoryItem.getChildren.md)

</td><td>



</td><td>

Gets the children of the directory.

</td></tr>
<tr><td>

[getStorageIdentity()](./IMutableFileTreeDirectoryItem.getStorageIdentity.md)

</td><td>



</td><td>

Says what storage this directory names, so a consumer can tell whether two
directory items reach the same place.

</td></tr>
</tbody></table>
